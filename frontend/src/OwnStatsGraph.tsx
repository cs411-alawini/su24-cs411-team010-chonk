import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import OwnStatsGraphStyles from './OwnStatsGraph.module.css';

interface GraphModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[];
    title: string;
    dataKey: string;
}

const GraphModal: React.FC<GraphModalProps> = ({ isOpen, onClose, data, title, dataKey }) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay className={OwnStatsGraphStyles.modalOverlay} />
        <ModalContent className={OwnStatsGraphStyles.modalContent}>
          <ModalHeader className={OwnStatsGraphStyles.modalHeader}>{title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody className={OwnStatsGraphStyles.modalBody}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </ModalBody>
          <ModalFooter className={OwnStatsGraphStyles.modalFooter}>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };
  

export default GraphModal;