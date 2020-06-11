import React, { Component }  from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import PickerSelect from 'react-native-picker-select';
import { CheckedIcon, UncheckedIcon } from '../images/svg-icons';
import Geolocation from '@react-native-community/geolocation';

import { add, userID , checkin} from '../lib/utils'

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    padding: 22,
    backgroundColor: '#FFF'
  },
  splitView: {
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  typeArea: {
    width: '40%'
  },
  label: {
    fontFamily: 'IBMPlexSans-Medium',
    color: '#000',
    fontSize: 14,
    paddingBottom: 5
  },
  selector: {
    fontFamily: 'IBMPlexSans-Medium',
    borderColor: '#D0E2FF',
    borderWidth: 2,
    padding: 16,
    marginBottom: 25
  },
  quantityArea: {
    width: '40%',
    height: '20%'
  },
  textInput: {
    fontFamily: 'IBMPlexSans-Medium',
    flex: 1,
    borderColor: '#D0E2FF',
    borderWidth: 2,
    padding: 14,
    elevation: 2,
    marginBottom: 25
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  checkboxLabel: {
    fontFamily: 'IBMPlexSans-Light',
    fontSize: 13
  },
  textInputDisabled: {
    fontFamily: 'IBMPlexSans-Medium',
    backgroundColor: '#f4f4f4',
    color: '#999',
    flex: 1,
    padding: 16,
    elevation: 2,
    marginBottom: 25
  },
  button: {
    backgroundColor: '#1062FE',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSans-Medium',
    fontSize: 16,
    overflow: 'hidden',
    padding: 12,
    textAlign:'center',
    marginTop: 15
  }
});

const Checkin = (props) => {
  const clearItem = {token: ''}
  const [item, setItem] = React.useState(clearItem);
  
  const sendItem = () => {
    const payload = {
      token: item.token,
      id: props.route.params._id
    };

    checkin(payload)
      .then(() => {
        Alert.alert('Yay!', 'You have been checked in.', [{text: 'OK', onPress: () => {props.navigation.navigate('Home');}}]);
        setItem({ ...clearItem });
      })
      .catch(err => {
        console.log(err, payload);
        Alert.alert('ERROR', 'Please try again. If the problem persists contact an administrator.', [{text: 'OK'}]);
      });
  };

  return (
    <ScrollView style={styles.outerView}>
      <View style={styles.splitView}>
      <Text style={styles.label}>Token</Text>
      <TextInput
        style={styles.textInput}
        value={item.token}
        onChangeText={(t) => setItem({ ...item, token: t})}
        onSubmitEditing={sendItem}
        returnKeyType='send'
        enablesReturnKeyAutomatically={true}
        placeholder='user@domain.com'
      />
    
      {
        item.token.trim() !== '' &&
        <TouchableOpacity onPress={sendItem}>
          <Text style={styles.button}>Check-in</Text>
        </TouchableOpacity>
      }
      </View>
    </ScrollView>
  );
};

export default Checkin;
