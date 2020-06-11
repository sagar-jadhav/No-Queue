import React from 'react';
import { StyleSheet, Text, TextInput, FlatList, View, TouchableOpacity, Alert } from 'react-native';
import PickerSelect from 'react-native-picker-select';

import { search } from '../lib/utils';

const styles = StyleSheet.create({
  outerView: {
    backgroundColor: '#FFF',
    width: '100%',
    height: '100%'
  },
  inputsView: {
    backgroundColor: '#F1F0EE',
    padding: 16,
    padding: 22,
  },
  label: {
    fontFamily: 'IBMPlexSans-Medium',
    color: '#000',
    fontSize: 14,
    paddingBottom: 5
  },
  selector: {
    fontFamily: 'IBMPlexSans-Medium',
    backgroundColor: '#fff',
    padding: 8,
    marginBottom: 10
  },
  textInput: {
    fontFamily: 'IBMPlexSans-Medium',
    backgroundColor: '#fff',
    padding: 8,
    marginBottom: 10
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
  },
  searchResultText: {
    fontFamily: 'IBMPlexSans-Bold',
    padding: 10,
    color: '#1062FE'
  },
  flatListView: {
    backgroundColor: '#FFF'
  },
  itemTouchable: {
    flexDirection: 'column',
    padding: 15,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    borderBottomColor: '#dddddd',
    borderBottomWidth: 0.25
  },
  itemView: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  itemName: {
    fontSize: 24,
    fontFamily: 'IBMPlexSans-Medium',
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans-Medium',
    color: 'gray'
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'IBMPlexSans-Medium',
    color: 'gray'
  }
});

const SearchResources = function ({ route, navigation }) {
  const [query, setQuery] = React.useState({ category: 'EatOuts', sub_category: '', name: '' });
  const [items, setItems] = React.useState([]);
  const [info, setInfo] = React.useState('');

  const Item = (props) => {
    return (
      <TouchableOpacity style={styles.itemTouchable}
          onPress={() => { navigation.navigate('Map', { item: props }); }}>
        <View style={styles.itemView}>
          <Text style={styles.itemName}>{props.name}</Text>
          <Text style={styles.itemQuantity}> ( {props.in_store} / {props.serving_capacity} ) [{props.in_queue}] </Text>
        </View>
        <View style={styles.itemView}>
          <TouchableOpacity onPress={bookMySlot}>
            <Text style={styles.button}>Book</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {navigation.navigate('Checkin', props);}}>
            <Text style={styles.button}>Check-in</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {navigation.navigate('Checkout', props);}}>
            <Text style={styles.button}>Check-out</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const bookMySlot = () => {
    let message = 'Your booking token is ' + Math.floor(1000 + Math.random() * 9000);
    Alert.alert('Thank you!', message, [{text: 'OK', onPress: () => {navigation.navigate('Search');}}]);
  };

  const searchItem = () => {
    const payload = {
      ...query
    };

    search(payload)
      .then((results) => {
        setInfo(`${results.length} result(s)`)
        setItems(results);
        console.log(payload);
      })
      .catch(err => {
        console.log(err);
        Alert.alert('ERROR', 'Please try again. If the problem persists contact an administrator.', [{text: 'OK'}]);
      });
  };

  return (
    <View style={styles.outerView}>
      <View style={styles.inputsView}>
        <Text style={styles.label}>Type</Text>
        <PickerSelect
          style={{ inputIOS: styles.selector }}
          value={query.type}
          onValueChange={(t) => setQuery({ ...query, category: t })}
          items={[
              { label: 'EatOuts', value: 'eatouts' },
              { label: 'Stores', value: 'stores' },
              { label: 'Services', value: 'services' }
          ]}
        />
        <Text style={styles.label}>Sub-Type</Text>
        <PickerSelect
          style={{ inputIOS: styles.selector }}
          value={query.subtype}
          onValueChange={(t) => setQuery({ ...query, sub_category: t })}
          items={[
              { label: 'General Stores', value: 'general_stores' },
              { label: 'Medical Stores', value: 'medical_stores' },
              {label: 'Liquor Stores', value: 'liquor_stores'},
              {label: 'Restaurant', value: 'restaurant'}, {label: 'Ice Cream Parlours', value: 'ice_cream'},
              {label: 'Garage Service', value: 'garage_service'}, {label: 'Petrol Pump', value: 'petrol_pump'},{label: 'Pathology', value: 'pathology'}
          ]}
        />
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.textInput}
          value={query.name}
          onChangeText={(t) => setQuery({ ...query, name: t})}
          onSubmitEditing={searchItem}
          returnKeyType='send'
          enablesReturnKeyAutomatically={true}
          placeholder='e.g., Medical'
          blurOnSubmit={false}
        />
        <TouchableOpacity onPress={searchItem}>
          <Text style={styles.button}>Search</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.searchResultText}>{info}</Text>

      <FlatList style={styles.flatListView}
        data={items}
        renderItem={({ item }) => <Item {...item} />}
        keyExtractor={item => item.id || item['_id']}
      />
    </View>
  );
};

export default SearchResources;
