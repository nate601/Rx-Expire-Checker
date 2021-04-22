import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Button} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(null);

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
        var results = [] 
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
            if(currentState === "serial" || currentState === "lot") //FNC1 terminated fields
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
        return results;
    }
    const handleBarCodeScanned = ({ type, data }) => 
    {
        if(type === BarCodeScanner.Constants.BarCodeType.datamatrix)
        {
            console.log(data);
            var results = readData(data);
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

    const getFormattedDateFromGS1Date = (preformattedDate) =>
    {
        var dateObj = new Date(2000 + parseInt(preformattedDate.substring(0,2)), parseInt(preformattedDate.substring(2,4)) - 1, parseInt(preformattedDate.substring(4,6)))
        return dateObj.toDateString();
    }



  return (
    <View style={styles.container}>
        {scanned == null &&
            <BarCodeScanner
                onBarCodeScanned = {scanned != null ? undefined : handleBarCodeScanned}
                style = {StyleSheet.absoluteFillObject}
            />
        }
        {scanned != null && 
            <View>
                {scanned.find(x=>x.key == "unknown") != null && 
                    <Text>This barcode had one or more GS1 AI that were not correctly identified.</Text>
                }
                {scanned.find(x=>x.key == "unknown") == null &&
                    <View>
                        <Text>GTIN: {scanned.find(x => x.key == "gtin").value != null && scanned.find(x => x.key == "gtin").value}</Text>
                        <Text>Serial Number: {scanned.find(x => x.key == "serial").value != null && scanned.find(x => x.key == "serial").value}</Text>
                        <Text>Expiration Date: {scanned.find(x => x.key == "expirationdate").value != null && scanned.find(x=>x.key=="expirationdate").value}</Text>
                        <Text>Lot Number: {scanned.find(x => x.key == "lot").value != null && scanned.find(x=>x.key=="lot").value}</Text>
                        <Text>Formatted Date: {getFormattedDateFromGS1Date(scanned.find(x=>x.key=="expirationdate").value)}</Text>
                    </View>
                }
                <Button title = {'Tap to Scan Again'} onPress={()=>setScanned(null)}/>
            </View>
        }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
