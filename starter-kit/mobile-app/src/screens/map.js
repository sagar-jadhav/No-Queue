import React, { useRef } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Config from 'react-native-config';
import { CheckedIcon, UncheckedIcon } from '../images/svg-icons';
import Geolocation from '@react-native-community/geolocation';

import { search } from '../lib/utils'

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1
  },
  label: {
    fontFamily: 'IBMPlexSans-Medium',
    color: '#000',
    fontSize: 14,
    paddingBottom: 5
  },
  textInput: {
    fontFamily: 'IBMPlexSans-Medium',
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10
  },
  itemView: {
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    padding: 10
  },
  checkboxLabel: {
    fontFamily: 'IBMPlexSans-Light',
    fontSize: 16
  }
});

const hereApikey = Config.HERE_APIKEY;

const Map = (props) => {
  const webView = useRef(null);
  const [query, setQuery] = React.useState({ name: '' , nearby: true});
  const [useNearBy] = React.useState(true);
  const onMessage = (event) => {
    const message = JSON.parse(event.nativeEvent.data);
    if(props && !(props.route.params && props.route.params.item)){
      message.name = ' '
      search(message.name)
      .then((response) => {
        sendMessage({ search: response });
      })
      .catch(err => {
        console.log(err)
        Alert.alert('ERROR', 'Please try again. If the problem persists contact an administrator.', [{text: 'OK'}]);
      });
    };
    if (message.status && message.status === 'initialized') {
      Geolocation.getCurrentPosition((position) => {
        sendMessage(position);
      });

      if (props.route.params && props.route.params.item) {
        sendMessage({ item: props.route.params.item });
      }
    } else if (message.search) {
      search(message.search)
        .then((response) => {
          sendMessage({ search: response });
        })
        .catch(err => {
          console.log(err)
          Alert.alert('ERROR', 'Please try again. If the problem persists contact an administrator.', [{text: 'OK'}]);
        });
    }
  };
  const searchItem = () => {
    const payload = {
      ...query
    };

    search(payload)
      .then((results) => {
        sendMessage({search: results});
        console.log( results, "....................");
      })
      .catch(err => {
        console.log(err);
        Alert.alert('ERROR', 'Please try again. If the problem persists contact an administrator.', [{text: 'OK'}]);
      });
  }

  const toggleNearBy = () => {
      setQuery({
        ...query,
        nearby: useNearBy
      })
      search(query);
  };

  const sendMessage = (data) => {
    const message = 
      `(function() {
        document.dispatchEvent(new MessageEvent('message', {data: ${JSON.stringify(data)}}));
      })()`;

    webView.current.injectJavaScript(message);
  }

  const sourceUri = (Platform.OS === 'android' ? 'file:///android_asset/' : '') + 'Web.bundle/loader.html';
  const injectedJS = `
    if (!window.location.search) {
      var link = document.getElementById('progress-bar');
      link.href = './site/here.html?apikey=${hereApikey}';
      link.click();
    }
  `;

  return (
    <View style={styles.mapContainer}>      
        <TouchableOpacity style={styles.itemTouchable}>
        <View style={styles.itemView}>
          {/* <Text style={styles.label}>Search :</Text> */}
          <View style={styles.checkboxContainer}>
        <TouchableOpacity onPress={toggleNearBy}>
          {
            (useNearBy)
              ?
              <CheckedIcon height='18' width='18'/>
              :
              <UncheckedIcon height='18' width='18'/>
          }
        </TouchableOpacity>
        <Text style={styles.checkboxLabel}> Search for NearBy </Text>
      </View>
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
        </View>
      </TouchableOpacity>
      <WebView          
        injectedJavaScript={injectedJS}
        source={{ uri: sourceUri }}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        allowFileAccess={true}
        onMessage={onMessage}
        ref={webView}
      />
    </View>
  );
};

export default Map;
