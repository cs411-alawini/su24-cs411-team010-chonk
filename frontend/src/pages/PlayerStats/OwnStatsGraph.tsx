import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Box,
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  title: string;
  dataKey: string;
}

const GraphModal: React.FC<GraphModalProps> = ({
  isOpen,
  onClose,
  data,
  title,
  dataKey,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay />
      <ModalContent style={{ backgroundColor: "#1a202c" }}>
        <ModalHeader style={{ color: "white" }}>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box display="flex" justifyContent="flex-start" paddingLeft="0">
            <ResponsiveContainer width="90%" height={400}>
              <LineChart data={data}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={dataKey} stroke="#ff4454" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button variant="valoRed" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GraphModal;
