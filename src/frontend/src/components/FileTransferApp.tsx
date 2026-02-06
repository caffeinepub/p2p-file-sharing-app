import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { ConnectionManager } from '@/components/ConnectionManager';
import { FileSender } from '@/components/FileSender';
import { FileReceiver } from '@/components/FileReceiver';
import { TransferHistory } from '@/components/TransferHistory';
import { useWebRTC } from '@/hooks/useWebRTC';

export function FileTransferApp() {
  const [activeTab, setActiveTab] = useState<'connect' | 'send' | 'receive' | 'history'>('connect');
  const webrtc = useWebRTC();

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Lightning-Fast File Sharing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transfer files directly between devices on your local network. Up to 10× faster than cloud services.
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="bg-accent/50 border-accent">
          <Info className="h-4 w-4" />
          <AlertDescription>
            All transfers happen directly between your devices using peer-to-peer technology. 
            No files are uploaded to any server.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>File Transfer</CardTitle>
            <CardDescription>
              Connect with another device and start sharing files securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="connect">Connect</TabsTrigger>
                <TabsTrigger value="send" disabled={!webrtc.isConnected}>
                  Send
                </TabsTrigger>
                <TabsTrigger value="receive" disabled={!webrtc.isConnected}>
                  Receive
                </TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="connect" className="space-y-4">
                <ConnectionManager webrtc={webrtc} />
              </TabsContent>

              <TabsContent value="send" className="space-y-4">
                <FileSender webrtc={webrtc} />
              </TabsContent>

              <TabsContent value="receive" className="space-y-4">
                <FileReceiver webrtc={webrtc} />
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <TransferHistory />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
