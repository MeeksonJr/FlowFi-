import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ScrollView, Image } from 'react-native';
import { supabase } from './lib/supabase';
import ReceiptCamera from './components/ReceiptCamera';
import { Session } from '@supabase/supabase-js';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (session && session.user) {
    return <Dashboard session={session} />;
  }

  return <Auth />;
}

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FlowFi Mobile Auth</Text>
      <TextInput
        style={styles.input}
        onChangeText={(text) => setEmail(text)}
        value={email}
        placeholder="email@address.com"
        autoCapitalize={'none'}
      />
      <TextInput
        style={styles.input}
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry={true}
        placeholder="Password"
        autoCapitalize={'none'}
      />
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button title="Sign in" disabled={loading} onPress={() => signInWithEmail()} />
      </View>
      <View style={styles.verticallySpaced}>
        <Button title="Sign up" disabled={loading} onPress={() => signUpWithEmail()} />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

function Dashboard({ session }: { session: Session }) {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [pendingReceipts, setPendingReceipts] = useState<any[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, [session]);

  async function fetchData() {
    try {
      setLoading(true);
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (profile) setRole(profile.role || '');

      const { data: receipts } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'parsed');
      if (receipts) setPendingReceipts(receipts);
      
    } catch (error: any) {
      Alert.alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmReceipt() {
    if (!selectedReceipt) return;
    try {
      setLoading(true);
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: session.user!.id,
        receipt_id: selectedReceipt.id,
        amount: parseFloat(amount),
        merchant,
        description,
        date: new Date().toISOString(),
      });
      if (txError) throw txError;

      const { error: rxError } = await supabase.from('receipts').update({
        status: 'confirmed'
      }).eq('id', selectedReceipt.id);
      if (rxError) throw rxError;

      Alert.alert('Success', 'Transaction saved!');
      setSelectedReceipt(null);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (showCamera) {
    return (
      <View style={{ flex: 1, marginTop: 40 }}>
        <Button title="Back to Dashboard" onPress={() => { setShowCamera(false); fetchData(); }} />
        <View style={{ flex: 1 }}>
          <ReceiptCamera />
        </View>
      </View>
    );
  }

  if (selectedReceipt) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Confirm Receipt</Text>
        <Image source={{ uri: selectedReceipt.image_url }} style={{ height: 200, resizeMode: 'contain', marginBottom: 20 }} />
        <Text style={{fontWeight: 'bold'}}>Extracted Data:</Text>
        <Text>Merchant: {selectedReceipt.parsed_data?.merchantName}</Text>
        <Text>Total: ${selectedReceipt.parsed_data?.totalAmount}</Text>
        
        <View style={styles.mt20}>
          <TextInput style={styles.input} placeholder="Merchant" value={merchant} onChangeText={setMerchant} />
          <TextInput style={styles.input} placeholder="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
        </View>
        <Button title="Confirm Transaction" disabled={loading} onPress={confirmReceipt} />
        <View style={styles.mt20}>
          <Button title="Cancel" onPress={() => setSelectedReceipt(null)} color="gray" />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Welcome {session.user.email}</Text>
      
      <View style={styles.mt20}>
        <Button title="Scan Receipt" onPress={() => setShowCamera(true)} />
      </View>

      {pendingReceipts.length > 0 && (
        <View style={styles.mt20}>
          <Text style={{fontWeight: 'bold', fontSize: 18, marginBottom: 10}}>Pending Receipts ({pendingReceipts.length})</Text>
          {pendingReceipts.map(r => (
            <View key={r.id} style={{ padding: 10, borderWidth: 1, borderColor: '#ccc', marginVertical: 5, borderRadius: 5, backgroundColor: '#fff' }}>
              <Text style={{fontWeight: '500'}}>{r.parsed_data?.merchantName || 'Unknown'} - ${r.parsed_data?.totalAmount || '0'}</Text>
              <View style={styles.mt20}>
                <Button title="Review" onPress={() => {
                  setSelectedReceipt(r);
                  setMerchant(r.parsed_data?.merchantName || '');
                  setAmount(r.parsed_data?.totalAmount?.toString() || '');
                  setDescription('');
                }} />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.mt20}>
        <Button title="Sign Out" onPress={() => supabase.auth.signOut()} color="red" />
      </View>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
});
