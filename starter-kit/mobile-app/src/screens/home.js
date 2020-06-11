import React from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, Button, Linking } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

const styles = StyleSheet.create({
  center: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  scroll: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 25,
    paddingTop: 75
  },
  image: {
    alignSelf: 'center',
    height: '100%',
    width:'100%',
    resizeMode: 'stretch'
  },
  title: {
    fontFamily: 'IBMPlexSans-Medium',
    fontSize: 36,
    color: '#323232',
    paddingBottom: 15
  },
  subtitle: {
    fontFamily: 'IBMPlexSans-Light',
    fontSize: 24,
    color: '#323232',
    textDecorationColor: '#D0E2FF',
    textDecorationLine: 'underline',
    paddingBottom: 5,
    paddingTop: 20
  },
  content: {
    fontFamily: 'IBMPlexSans-Light',
    color: '#323232',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 16
  },
  buttonGroup: {
    flex: 1,
    paddingTop: 15,
    width: 175
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


const Home = ({navigation}) => (
  <View style={styles.center}>
    <ScrollView style={styles.scroll}>
      <Image
        style={styles.image}
        source={require('../images/image.png')}
      />
      {/* <Text style={styles.subtitle}>Why wait in Queue ?</Text> */}
      {/* <Text style={styles.title}>Kueue</Text> */}
      {/* <Text style={styles.content}>
        There is a growing interest in enabling communities to cooperate among
        themselves to solve problems in times of crisis, whether it be to
        advertise where supplies are held, offer assistance for collections, or
        other local services like volunteer deliveries.
      </Text>
      <Text style={styles.content}>
        What is needed is a solution that empowers communities to easily connect
        and provide this information to each other.
      </Text>
      <Text style={styles.content}>
        This solution starter kit provides a mobile application, along with
        server-side components, that serves as the basis for developers to build
        out a community cooperation application that addresses local needs for
        food, equipment, and resources.
      </Text> */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity onPress={() => {navigation.navigate('Login');}}>
          <Text style={styles.button}>Login for Vendor</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity onPress={() => {navigation.navigate('Register');}}>
          <Text style={styles.button}>Register for Vendor</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
);

export default Home;
