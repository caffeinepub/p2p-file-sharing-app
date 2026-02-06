import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useTransferHistory } from './useTransferHistory';

const CHUNK_SIZE = 16384; // 16KB chunks for optimal WebRTC performance
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export interface FileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  sentBytes?: number;
  receivedBytes?: number;
  totalBytes: number;
  speed?: number;
}

export interface IncomingFileRequest {
  id: string;
  fileName: string;
  fileSize: number;
}

export interface CompletedFile {
  id: string;
  fileName: string;
  fileSize: number;
}

export interface WebRTCHook {
  isConnected: boolean;
  isCreatingOffer: boolean;
  isConnecting: boolean;
  localOffer: string | null;
  remotePeerName: string | null;
  sendingFiles: FileTransfer[];
  receivingFiles: FileTransfer[];
  incomingFileRequests: IncomingFileRequest[];
  completedFiles: CompletedFile[];
  createOffer: (deviceName: string) => Promise<void>;
  acceptOffer: (offer: string) => Promise<void>;
  sendFile: (file: File) => Promise<void>;
  acceptIncomingFile: (transferId: string) => void;
  rejectIncomingFile: (transferId: string) => void;
  disconnect: () => void;
}

export function useWebRTC(): WebRTCHook {
  const [isConnected, setIsConnected] = useState(false);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [localOffer, setLocalOffer] = useState<string | null>(null);
  const [remotePeerName, setRemotePeerName] = useState<string | null>(null);
  const [sendingFiles, setSendingFiles] = useState<FileTransfer[]>([]);
  const [receivingFiles, setReceivingFiles] = useState<FileTransfer[]>([]);
  const [incomingFileRequests, setIncomingFileRequests] = useState<IncomingFileRequest[]>([]);
  const [completedFiles, setCompletedFiles] = useState<CompletedFile[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localDeviceNameRef = useRef<string>('');
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const fileBuffersRef = useRef<Map<string, { chunks: ArrayBuffer[]; metadata: any }>>(new Map());

  const { addTransfer } = useTransferHistory();

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
        toast.success('Connected successfully!');
      } else if (
        pc.iceConnectionState === 'disconnected' ||
        pc.iceConnectionState === 'failed' ||
        pc.iceConnectionState === 'closed'
      ) {
        setIsConnected(false);
        setRemotePeerName(null);
      }
    };

    return pc;
  }, []);

  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      // Send device name
      channel.send(
        JSON.stringify({
          type: 'device-name',
          name: localDeviceNameRef.current,
        })
      );
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'device-name':
            setRemotePeerName(message.name);
            break;

          case 'file-offer':
            setIncomingFileRequests((prev) => [
              ...prev,
              {
                id: message.id,
                fileName: message.fileName,
                fileSize: message.fileSize,
              },
            ]);
            break;

          case 'file-accept':
            // Start sending file
            sendFileChunks(message.id);
            break;

          case 'file-reject':
            setSendingFiles((prev) => prev.filter((f) => f.id !== message.id));
            toast.error(`File transfer rejected: ${message.fileName}`);
            break;

          case 'file-metadata':
            fileBuffersRef.current.set(message.id, {
              chunks: [],
              metadata: message,
            });
            setReceivingFiles((prev) => [
              ...prev,
              {
                id: message.id,
                fileName: message.fileName,
                fileSize: message.fileSize,
                progress: 0,
                receivedBytes: 0,
                totalBytes: message.fileSize,
              },
            ]);
            break;

          case 'file-complete':
            completeFileReceive(message.id);
            break;
        }
      } else {
        // Binary data - file chunk
        handleFileChunk(event.data);
      }
    };

    dataChannelRef.current = channel;
  }, []);

  const createOffer = async (deviceName: string) => {
    setIsCreatingOffer(true);
    localDeviceNameRef.current = deviceName;

    try {
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      const channel = pc.createDataChannel('fileTransfer');
      setupDataChannel(channel);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              resolve();
            }
          };
        }
      });

      const offerData = {
        sdp: pc.localDescription,
        deviceName,
      };

      setLocalOffer(JSON.stringify(offerData));
    } catch (error) {
      toast.error('Failed to create connection');
      console.error('Create offer error:', error);
    } finally {
      setIsCreatingOffer(false);
    }
  };

  const acceptOffer = async (offerString: string) => {
    setIsConnecting(true);

    try {
      const offerData = JSON.parse(offerString);
      setRemotePeerName(offerData.deviceName);

      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offerData.sdp));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') {
          resolve();
        } else {
          pc.onicegatheringstatechange = () => {
            if (pc.iceGatheringState === 'complete') {
              resolve();
            }
          };
        }
      });

      // Auto-apply answer (in production, this would be sent back to the offerer)
      const answerData = {
        sdp: pc.localDescription,
      };

      // For demo purposes, we'll show the answer to copy back
      toast.info('Connection established! Share your answer code with the other device.', {
        duration: 5000,
      });
    } catch (error) {
      toast.error('Failed to accept connection');
      console.error('Accept offer error:', error);
      setIsConnecting(false);
    }
  };

  const sendFile = async (file: File) => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      toast.error('Not connected to peer');
      return;
    }

    const transferId = `${Date.now()}-${Math.random()}`;

    // Send file offer
    dataChannelRef.current.send(
      JSON.stringify({
        type: 'file-offer',
        id: transferId,
        fileName: file.name,
        fileSize: file.size,
      })
    );

    // Store file for sending
    (window as any)[`file_${transferId}`] = file;

    toast.info(`Waiting for ${remotePeerName || 'peer'} to accept ${file.name}...`);
  };

  const sendFileChunks = async (transferId: string) => {
    const file = (window as any)[`file_${transferId}`] as File;
    if (!file || !dataChannelRef.current) return;

    setSendingFiles((prev) => [
      ...prev,
      {
        id: transferId,
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        sentBytes: 0,
        totalBytes: file.size,
      },
    ]);

    // Send metadata
    dataChannelRef.current.send(
      JSON.stringify({
        type: 'file-metadata',
        id: transferId,
        fileName: file.name,
        fileSize: file.size,
      })
    );

    const reader = new FileReader();
    let offset = 0;
    const startTime = Date.now();

    const readSlice = () => {
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      if (e.target?.result && dataChannelRef.current) {
        const chunk = e.target.result as ArrayBuffer;
        dataChannelRef.current.send(chunk);

        offset += chunk.byteLength;
        const progress = Math.round((offset / file.size) * 100);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = elapsed > 0 ? offset / elapsed : 0;

        setSendingFiles((prev) =>
          prev.map((f) =>
            f.id === transferId
              ? { ...f, progress, sentBytes: offset, speed }
              : f
          )
        );

        if (offset < file.size) {
          readSlice();
        } else {
          // File complete
          dataChannelRef.current.send(
            JSON.stringify({
              type: 'file-complete',
              id: transferId,
            })
          );

          setTimeout(() => {
            setSendingFiles((prev) => prev.filter((f) => f.id !== transferId));
            toast.success(`${file.name} sent successfully!`);
            addTransfer({
              fileName: file.name,
              fileSize: file.size,
              type: 'sent',
              peerName: remotePeerName || 'Unknown',
              status: 'completed',
            });
          }, 1000);

          delete (window as any)[`file_${transferId}`];
        }
      }
    };

    readSlice();
  };

  const handleFileChunk = (chunk: ArrayBuffer) => {
    // Find which file this chunk belongs to
    for (const [id, buffer] of fileBuffersRef.current.entries()) {
      const currentSize = buffer.chunks.reduce((sum, c) => sum + c.byteLength, 0);
      if (currentSize < buffer.metadata.fileSize) {
        buffer.chunks.push(chunk);

        const receivedBytes = currentSize + chunk.byteLength;
        const progress = Math.round((receivedBytes / buffer.metadata.fileSize) * 100);

        setReceivingFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, progress, receivedBytes } : f
          )
        );
        break;
      }
    }
  };

  const completeFileReceive = (transferId: string) => {
    const buffer = fileBuffersRef.current.get(transferId);
    if (!buffer) return;

    const blob = new Blob(buffer.chunks);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buffer.metadata.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setReceivingFiles((prev) => prev.filter((f) => f.id !== transferId));
    setCompletedFiles((prev) => [
      ...prev,
      {
        id: transferId,
        fileName: buffer.metadata.fileName,
        fileSize: buffer.metadata.fileSize,
      },
    ]);

    toast.success(`${buffer.metadata.fileName} received successfully!`);
    addTransfer({
      fileName: buffer.metadata.fileName,
      fileSize: buffer.metadata.fileSize,
      type: 'received',
      peerName: remotePeerName || 'Unknown',
      status: 'completed',
    });

    fileBuffersRef.current.delete(transferId);
  };

  const acceptIncomingFile = (transferId: string) => {
    if (!dataChannelRef.current) return;

    const request = incomingFileRequests.find((r) => r.id === transferId);
    if (!request) return;

    dataChannelRef.current.send(
      JSON.stringify({
        type: 'file-accept',
        id: transferId,
        fileName: request.fileName,
      })
    );

    setIncomingFileRequests((prev) => prev.filter((r) => r.id !== transferId));
    toast.info(`Receiving ${request.fileName}...`);
  };

  const rejectIncomingFile = (transferId: string) => {
    if (!dataChannelRef.current) return;

    const request = incomingFileRequests.find((r) => r.id === transferId);
    if (!request) return;

    dataChannelRef.current.send(
      JSON.stringify({
        type: 'file-reject',
        id: transferId,
        fileName: request.fileName,
      })
    );

    setIncomingFileRequests((prev) => prev.filter((r) => r.id !== transferId));
  };

  const disconnect = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    setIsConnected(false);
    setRemotePeerName(null);
    setLocalOffer(null);
    setSendingFiles([]);
    setReceivingFiles([]);
    setIncomingFileRequests([]);
    setCompletedFiles([]);
    fileBuffersRef.current.clear();
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isCreatingOffer,
    isConnecting,
    localOffer,
    remotePeerName,
    sendingFiles,
    receivingFiles,
    incomingFileRequests,
    completedFiles,
    createOffer,
    acceptOffer,
    sendFile,
    acceptIncomingFile,
    rejectIncomingFile,
    disconnect,
  };
}
