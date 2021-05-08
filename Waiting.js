import React from 'react';
import {Text, StyleSheet, View} from 'react-native'
import {Callout} from'react-native-ios-kit'
class WaitingScreen extends React.Component
{
    render(){
        return (
            <View style ={styles.container}><Callout style={styles.waitingText}>Waiting for scan</Callout></View>
        );
    }
}
export default WaitingScreen;
const styles = StyleSheet.create({
    waitingText: {
    },
    container:{
        padding:24,
        alignItems: "center"

    }

});
