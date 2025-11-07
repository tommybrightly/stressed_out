import { useEffect, useRef, useState } from "react";
import {
View,
Text,
TextInput,
Button,
FlatList,
KeyboardAvoidingView,
Platform,
StyleSheet
} from "react-native";
import ChatMessage from "../../src/components/ChatMessage";
import { Message } from "../types";
import { getAiReply } from "../../src/lib/mockAi";
import { loadMessages, saveMessages, logStress } from "../../src/storage/storage";
import StressTagInput from "../../src/components/StressTagInput";


export default function HomeScreen() {
const [messages, setMessages] = useState<Message[]>([]);
const [text, setText] = useState("");
const lastUserMsgId = useRef<string | null>(null);


useEffect(() => {
(async () => {
const initial = await loadMessages();
setMessages(initial);
})();
}, []);


async function send() {
if (!text.trim()) return;
const userMsg: Message = {
id: Math.random().toString(36).slice(2),
text: text.trim(),
sender: "user",
createdAt: Date.now()
};
lastUserMsgId.current = userMsg.id;


const next = [...messages, userMsg];
setMessages(next);
setText("");
await saveMessages(next);


// Mock AI response
const replyText = await getAiReply(userMsg.text);
const aiMsg: Message = {
id: Math.random().toString(36).slice(2),
text: replyText,
sender: "ai",
createdAt: Date.now()
};
const next2 = [...next, aiMsg];
setMessages(next2);
await saveMessages(next2);
}

async function attachStress({ stress, tags }: { stress: number; tags: string[] }) {
    // Attach stress/tags to the last user message (if present), and log a StressEntry
    if (!messages.length) return;
    const idx = [...messages].reverse().findIndex(m => m.sender === "user");
    const realIdx = idx === -1 ? -1 : messages.length - 1 - idx;
    if (realIdx >= 0) {
    const copy = [...messages];
    copy[realIdx] = { ...copy[realIdx], stress, tags };
    setMessages(copy);
    await saveMessages(copy);
    
    
    await logStress({
    id: Math.random().toString(36).slice(2),
    createdAt: Date.now(),
    stress,
    tags,
    note: copy[realIdx].text
    });
    }
    }
    
    
    return (
    <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.select({ ios: "padding", android: undefined })}
    keyboardVerticalOffset={90}
    >
    <View style={styles.container}>
    <Text style={styles.title}>CalmSketch — Chat</Text>
    <FlatList
    data={messages}
    keyExtractor={m => m.id}
    contentContainerStyle={{ paddingBottom: 12 }}
    renderItem={({ item }) => <ChatMessage msg={item} />}
    style={{ flex: 1 }}
    />
    
    
    <View style={styles.row}>
    <TextInput
    style={styles.input}
    value={text}
    onChangeText={setText}
    placeholder="Tell me what's on your mind..."
    onSubmitEditing={send}
    returnKeyType="send"
    />
    <Button title="Send" onPress={send} />
    </View>
    
    
    <View style={{ marginTop: 8 }}>
    <StressTagInput onSave={attachStress} />
    </View>
    </View>
    </KeyboardAvoidingView>
    );
    }
    
    
    const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
    row: { flexDirection: "row", gap: 8, alignItems: "center" },
    input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
    }
    });