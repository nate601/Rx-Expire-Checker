import { StatusBar } from 'expo-status-bar';
import React, {useState, useEffect} from 'react';
import { StyleSheet, Text, View, Button} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function App() {
    const [hasPermission, setHasPermission] = useState(null);
    const [scanned, setScanned] = useState(false);

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
        var results = {}
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
                    default:
                        currentState = "unknown";
                }
                console.log("Current AI: " + AI + " is " + currentState);
                if(results[currentResultIndex] == null)
                {
                    results[currentResultIndex] = {};
                    results[currentResultIndex].ai = currentState;
                }
                i++; // Purge the next character as well so that the AI is not included in the data
                continue;
            }
            if(currentState === "unknown") //If an AI occurs that we have not configured a state for 
            {
                console.log("Unknown AI.");
                continue;
            }
            if(currentState === "gtin" || currentState === "expirationdate")
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
            if(currentState === "serial" || currentState === "lot")
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
    }
    const handleBarCodeScanned = ({ type, data }) => 
    {
        if(type === BarCodeScanner.Constants.BarCodeType.datamatrix)
        {
            alert("scanned: " + type + " : " + data)
            console.log(data);
            setScanned(true);
            readData(data);
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



  return (
    <View style={styles.container}>
        {!scanned &&
        <BarCodeScanner
          onBarCodeScanned = {scanned? undefined : handleBarCodeScanned}
          style = {StyleSheet.absoluteFillObject}
          />
            }
        {scanned && 
            <Button title = {'Tap to Scan Again'} onPress={()=>setScanned(false)}/>
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
