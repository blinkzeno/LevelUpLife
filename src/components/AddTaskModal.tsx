import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTasksStore } from '@/stores/tasksStore';
import { useUser } from '@clerk/clerk-expo';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddTaskModal = ({ visible, onClose }: AddTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useUser();
  const { addTask } = useTasksStore();

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'habitude.');
      return;
    }

    addTask({ title, description, status: 'todo' }, user.id);

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.title}>Ajouter une tache</Text>

          <TextInput
            style={styles.input}
            placeholder="Nom de la tache"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.input}
            placeholder="Description de la tache"
            value={description}
            onChangeText={setDescription}
          />

        

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddTaskModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  freqButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  activeFreqButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  freqText: {
    color: '#333',
  },
  activeFreqText: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f44336',
    borderRadius: 8,
    marginRight: 5,
  },
  saveButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginLeft: 5,
  },
  cancelText: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
  },
});