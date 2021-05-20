import React, { Component } from 'react'
import { Text, StyleSheet, View, SafeAreaView, Alert, TouchableHighlightComponent, ActivityIndicator } from 'react-native'
import { TextInput, Button } from 'react-native-paper';
import database, { FirebaseDatabaseTypes } from '@react-native-firebase/database';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

const reference = database().ref();

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    textInputContainer: {
        borderRadius: 5,
        marginTop: 38
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold'
    },
    buttonContainer: {
        alignSelf: 'flex-end',
        width: 100,
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40
    }
})

export default class App extends Component {
    state = {
        phoneNumber: '',
        code: '',
        isLoading: false
    }

    confirmation: FirebaseAuthTypes.ConfirmationResult = undefined

    loginUser() {
        const { phoneNumber } = this.state
        if (phoneNumber.trim().length <= 0) {
            return
        }
        this.showLoading()
        this.getUserProfile(async (data: FirebaseDatabaseTypes.DataSnapshot) => {
            if (data.val()) {
                await this.phoneVerification()
            } else {
                Alert.alert('Login', 'You\'re not registered yet.')
            }
            this.hideLoading()
        })
    }

    async phoneVerification() {
        const { phoneNumber } = this.state
        try {
            this.confirmation = await auth().signInWithPhoneNumber(phoneNumber)
            this.setState({})
        } catch (err) {
            Alert.alert('Login Cancelled', 'It seems you have canncelled login.')
        }
    }

    confirmPhoneNumber() {
        const { code } = this.state
        if (this.confirmation) {
            this.showLoading()
            this.confirmation
                .confirm(code)
                .then(result => {
                    this.getUserProfile((profile: FirebaseDatabaseTypes.DataSnapshot) => {
                        if (profile.val()) {
                            let profileData = profile.val()
                            let name = profileData[result.user.uid].name
                            let phoneNumber = profileData[result.user.uid].phoneNumber
                            Alert.alert('Login Success', `You're logged in.\nName: ${name}\nPhone no.: ${phoneNumber}`)
                            this.resetAll()
                            this.hideLoading()
                        }
                    })
                })
                .catch(reason => {
                    Alert.alert('Invalid Code', 'Please enter valid code.')
                    this.hideLoading()
                })

        }
    }

    getUserProfile(callback) {
        const { phoneNumber } = this.state
        reference
            .child('staff')
            .orderByChild('phoneNumber')
            .equalTo(phoneNumber)
            .on('value', snapshot => {
                if (callback)
                    callback(snapshot)
            })
    }

    resetAll() {
        this.confirmation = undefined
        this.setState({
            phoneNumber: '',
            code: ''
        })
    }

    showLoading() {
        this.setState({ isLoading: true })
    }

    hideLoading() {
        this.setState({ isLoading: false })
    }

    render() {
        const { phoneNumber, code, isLoading } = this.state
        return (
            <SafeAreaView style={styles.mainContainer}>
                {this.confirmation ? (
                    <View style={{ margin: 16 }}>
                        <Text style={styles.titleText}>
                            Verify Yourself
                        </Text>
                        <TextInput
                            style={styles.textInputContainer}
                            label="Code"
                            value={code}
                            onChangeText={(code) => this.setState({ code: code.replace(/[^0-9+]+/g, '') })}
                            mode='outlined'
                        />

                        <View style={styles.buttonContainer}>
                            {isLoading ? (<ActivityIndicator size='small' color='#555' />) : (
                                <Button mode='contained' onPress={this.confirmPhoneNumber.bind(this)}>
                                    Verify
                                </Button>
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={{ margin: 16 }}>
                        <Text style={styles.titleText}>
                            Login
                        </Text>
                        <TextInput
                            style={styles.textInputContainer}
                            label="Phone number (e.g +919876543210)"
                            value={phoneNumber}
                            onChangeText={(phoneNumber) => this.setState({ phoneNumber: phoneNumber.replace(/[^0-9+]+/g, '') })}
                            mode='outlined'
                        />

                        <View style={styles.buttonContainer}>
                            {isLoading ? (<ActivityIndicator size='small' color='#555' />) : (
                                <Button mode='contained' onPress={this.loginUser.bind(this)}>
                                    Login
                                </Button>
                            )}

                        </View>
                    </View>
                )}
            </SafeAreaView>
        )
    }
}
