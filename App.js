import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Vibration} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { ThemeProvider, DefaultTheme, Button, TableView, InfoRow} from 'react-native-ios-kit';
import WaitingScreen from './Waiting.js';
import GTINTable from './GTINTable.js';

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(null);
    const [cooldown, setCooldown] = useState(false);
    const [viewSettingsScreen, setViewSettingsScreen] = useState(false);

    useEffect(() => {
          (async () => {
                    const { status } = await BarCodeScanner.requestPermissionsAsync();
                    setHasPermission(status === 'granted');
                  })();
        }, []);

    const readData = (data) =>
    {
        var firstCharacter = data[0];
        var i;
        var currentState = "none"
        var results = [];
        var currentResultIndex = 0;
        var currentStateIndex = 0;
        for(i = 1; i < data.length; i++)
        {
            var currentCharacter = data[i];
            var nextCharacter = data[i+1];
            if(currentState === "none") // we currently need to read the AI by reading the currently selected character and adding the next character
            {
                console.log(results);
                var AI = currentCharacter.concat( nextCharacter )
                switch(AI)
                {
                    case "01": // GTIN 14
                        currentState = "gtin";
                        currentStateIndex = 14;
                        break;
                    case "17": // EXPIRATION DATE 6
                        currentState = "expirationdate";
                        currentStateIndex = 6;
                        break;
                    case "10": // BATCH/LOT NUMBER VARIABLE LENGTH
                        currentState = "lot";
                        currentStateIndex = -1;
                        break;
                    case "21": //SERIAL NUMBER VARIABLE LENGTH
                        currentState = "serial";
                        currentStateIndex = -1;
                        break;
                    case "25": //GLN Extension
                        if(data[i+2] == 4) // GLN extension AI is three digits: 254
                        {
                            currentState = "gln";
                            currentStateIndex = -1;
                            i++; // Since GLN AI is three digits, we must purge the next character so that the AI is not included in the data
                            break;
                        }
                        currentState = "unknown";
                        break;
                    default:
                        currentState = "unknown";
                }
                console.log("Current AI: " + AI + " is " + currentState);
                if(results[currentResultIndex] == null)
                {
                    results[currentResultIndex] = {};
                    results[currentResultIndex].ai = AI;
                    results[currentResultIndex].key = currentState;
                }
                i++; // Purge the next character as well so that the AI is not included in the data
                continue;
            }
            if(currentState === "unknown") //If an AI occurs that we have not configured a state for
            {
                console.log("Unknown AI.");
                continue;
            }
            if(currentState === "gtin" || currentState === "expirationdate") // Finite number fields
            {
                currentStateIndex--; //Otherwise, decrement the current state counter, and concat the current character to the result
                if(results[currentResultIndex].value == null) //Initialize the result index value
                {
                    results[currentResultIndex].value = "";
                }
                results[currentResultIndex].value = results[currentResultIndex].value.concat(currentCharacter);

                if(currentStateIndex === 0) //If we have counted out all the characters in the value, then return the state to none and increment the currentResult
                {
                    currentResultIndex++;
                    currentState = "none";
                }
                continue;
            }
            if(currentState === "serial" || currentState === "lot" || currentState === "gln") //FNC1 terminated fields
            {
                if(currentCharacter === firstCharacter) //If we have reached the end marking character, then return the state to none
                {
                    currentResultIndex++;
                    currentState = "none";
                    continue;
                }
                if(results[currentResultIndex].value == null) //Initialize the result index value
                {
                    results[currentResultIndex].value = "";
                }
                results[currentResultIndex].value = results[currentResultIndex].value.concat(currentCharacter);
                continue;
            }
        }
        console.log(results);
        Vibration.vibrate();
        return results;
    }
    const handleBarCodeScanned = ({ type, data }) =>
    {
        if(type === BarCodeScanner.Constants.BarCodeType.datamatrix)
        {
            setCooldown(true);
            setTimeout( ()=> setCooldown(false), 1500 );
            console.log(data);
            var results = readData(data);
            results.getAISafe = (name, arr) => {
                var retVal = arr.find(x=>x.key === name).value;
                if(retVal = null)
                {
                    return "none"
                }
                else
                {
                    return retVal;
                }
            }
            console.log(results);
            setScanned(results);
        }
    }

    if(hasPermission === null)
    {
        return <Text>Waiting for permissions</Text>;
    }
    if(hasPermission === false)
    {
        return <Text>Permission denied</Text>;
    }

    const getDateObjFromGS1Date = (preformattedDate) =>
    {
        var dateObj = new Date(2000 + parseInt(preformattedDate.substring(0,2)), parseInt(preformattedDate.substring(2,4)) - 1, parseInt(preformattedDate.substring(4,6)))
        return dateObj;
    }
    const getFormattedDateFromGS1Date = (preformattedDate) =>
    {
        var dateObj = new Date(2000 + parseInt(preformattedDate.substring(0,2)), parseInt(preformattedDate.substring(2,4)) - 1, parseInt(preformattedDate.substring(4,6)))
        return dateObj.toDateString();
    }
    const isToBePulled = (date) =>
    {
        var currentDate = new Date();
        var dateToBePulled = currentDate.setMonth(currentDate.getMonth + 3);
        if(date < dateToBePulled)
        {
            return true;
        }
        return false;
    }
    const getAISafe = (aiName) =>
    {
        if(scanned != null)
        {
            console.log(scanned);
            var retVal = scanned.find(x=>x.key === aiName);
            console.log(retVal)
            if(retVal == null)
            {
                return "No value"
            }
            else
            {
                return retVal.value;
            }
        }
        return "Awaiting scan!"
    }



  return (
      <ThemeProvider>
        <View style={styles.container}>
            {true &&
            <View style={styles.camera}>
                <BarCodeScanner
                    onBarCodeScanned = {cooldown ? undefined : handleBarCodeScanned}
                    style = {StyleSheet.absoluteFillObject}
                />
            </View>
            }
            <View style = {styles.info}>
            {scanned != null &&
                <View>
                    {scanned.find(x=>x.key == "unknown") != null &&
                        <Text>This barcode had one or more GS1 AI that were not correctly identified.</Text>
                    }
                    {scanned.find(x=>x.key == "unknown") == null &&
                        <View>
                            <GTINTable
                                GTIN={getAISafe("gtin")}
                                serial={getAISafe("serial")}
                                expirationFormatted={getFormattedDateFromGS1Date(getAISafe("expirationdate"))}
                                isToBePulled={isToBePulled(getAISafe("expirationdate"))}
                                lot={getAISafe("lot")}
                            />

                            <Button onPress={()=>setScanned(null)} inline rounded centered><Text>Press to clear scan</Text></Button>

                        </View>
                    }
                </View>
            }
            {scanned == null && <WaitingScreen/>}
            </View>
            {viewSettingsScreen &&
                <View style={styles.settings}>

                </View>
            }
        </View>
      </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  camera: {
    flex:2
  },
  info:{
    flex:1,
    alignItems: 'stretch'
},
    settings:{
        flex:1
    }}
);
