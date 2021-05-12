import React from 'react';
import {Text, View} from 'react-native'
import {TableView, InfoRow} from 'react-native-ios-kit';

class GTINTable extends React.Component
{
    render(){
        return (
            <TableView header={"GS1"}>
                <InfoRow
                    title={"GTIN"}
                    info={this.props.GTIN}
                />
                <InfoRow
                    title={"Serial Number"}
                    info={this.props.serial}
                />
                <InfoRow
                    title={"Expiration Date"}
                    info={this.props.expirationFormatted}
                    theme={{barColor: this.props.isToBePulled ? "red" : "white"}}
                />
                <InfoRow
                    title={"Lot Number"}
                    info={this.props.lot}
                />
            </TableView>
        );
    }
}
export default GTINTable

