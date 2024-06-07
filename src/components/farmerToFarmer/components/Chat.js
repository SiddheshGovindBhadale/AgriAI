import {
    ActivityIndicator, Image, SafeAreaView, ScrollView, Dimensions,
    StyleSheet, Text, TextInput, TouchableOpacity, View, LogBox, Keyboard
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import axios from 'axios';
import BottomNavigation from '../../../navigation/BottomNavigation';

LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
]);

const Chat = ({ route }) => {
    const navigation = useNavigation();
    const { item, userId, socket } = route.params;
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [arrivalMessage, setArrivalMessage] = useState(null);
    const scrollViewRef = useRef();

    const { width, height } = Dimensions.get('window');

    useEffect(() => {
        const fetchMessages = async () => {
            if (item) {
                const response = await axios.post(`${Config.API_URL}/getmsg`, {
                    from: userId,
                    to: item._id,
                });
                setMessages(response.data);
            }
        }

        fetchMessages();
    }, []);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        });

        return () => {
            keyboardDidShowListener.remove();
        };
    }, []);

    const handleSendMessage = async () => {
        if (message.length > 0) {
            socket.current.emit("send-msg", {
                to: item._id,
                from: userId,
                msg: message,
            });

            await axios.post(`${Config.API_URL}/addmsg`, {
                from: userId,
                to: item._id,
                message: message,
            });

            const msgs = [...messages];
            msgs.push({ fromSelf: true, message: message });
            setMessages(msgs);
            setMessage('');
        }
    }

    useEffect(() => {
        if (socket.current) {
            socket.current.on("msg-recieve", (msg) => {
                console.log(msg);
                setArrivalMessage({ fromSelf: false, message: msg });
            });
        }
    }, []);

    useEffect(() => {
        arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
    }, [arrivalMessage]);

    return (
        <SafeAreaView style={{ height: '100%', backgroundColor: '#ffffff' }}>
            {isLoading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#46c67c" />
            ) : (
                <View style={[styles.mainContainer, { height: '100%' }]}>
                    <View style={styles.topStatusBar}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={22} color="#ffffff" />
                        </TouchableOpacity>
                        <View style={styles.profileDetails}>
                            <View style={styles.profileContainer}>
                                <Image style={styles.profileImage} source={
                                    item.image
                                        ? { uri: `${Config.API_URL}${item.image}` }
                                        : require('../../../assets/icon/user.jpg')
                                } />
                            </View>
                            <Text style={styles.userName}>{item.name}</Text>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.chatContainer}
                        ref={scrollViewRef}
                        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                    >
                        {messages.map((message, index) => (
                            <View
                                key={index}
                                style={[styles.message, message.fromSelf ? styles.sended : styles.recieved]}
                            >
                                <Text style={[styles.chatText, { color: message.fromSelf ? '#ffffff' : '#3f484b' }]}>
                                    {message.message}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.sendInputContainer}>
                        <View style={styles.input}>
                            <TouchableOpacity style={styles.emojiSelecter}>
                                <MaterialIcons name="emoji-emotions" size={22} color="#3f484b" />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.inputText}
                                placeholder='Message'
                                placeholderTextColor={"#828282"}
                                value={message}
                                autoCapitalize='none'
                                autoCorrect={false}
                                onChangeText={setMessage}
                                onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            />
                        </View>
                        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                            <Ionicons name="send" size={20} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        backgroundColor: '#ffffff',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topStatusBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection: 'row',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 10,
        backgroundColor: '#46c67c',
    },
    backButton: {
        paddingVertical: 10,
        paddingLeft: 10,
    },
    heading: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    profileDetails: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    profileContainer: {
        width: 42,
        height: 42,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
        borderWidth: 2.5,
        borderColor: '#e9f1f1',
    },
    userName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#ffffff',
        marginLeft: 7,
        letterSpacing: 0.5,
    },
    sendInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        width: '100%',
        marginBottom: 10,
    },
    input: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderWidth: 0.2,
        borderColor: '#3f484b',
        width: '84%',
        borderRadius: 4,
        color: '#3f484b',
        gap: 5,
        paddingHorizontal: 10,
        backgroundColor: '#e9f1f1',
    },
    inputText: {
        paddingVertical: 8,
        width: '90%',
        color: '#3f484b',
        fontSize: 15,
    },
    sendButton: {
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 7,
        width: 46,
        backgroundColor: '#46c67c',
    },
    chatContainer: {
        marginHorizontal: 15,
    },
    message: {
        maxWidth: 240,
        paddingVertical: 7,
        paddingHorizontal: 15,
        borderRadius: 7,
        marginVertical: 5,
    },
    sended: {
        backgroundColor: '#46c67c',
        color: '#ffffff',
        alignSelf: 'flex-end',
    },
    recieved: {
        backgroundColor: '#e9f1f1',
        color: '#3f484b',
        alignSelf: 'flex-start',
    },
    chatText: {
        fontSize: 15,
        fontWeight: '400',
    }
});

export default Chat;
