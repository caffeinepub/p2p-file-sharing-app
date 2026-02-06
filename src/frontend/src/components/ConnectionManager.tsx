import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Loader2, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import type { WebRTCHook } from '@/hooks/useWebRTC';

interface ConnectionManagerProps {
  webrtc: WebRTCHook;
}

export function ConnectionManager({ webrtc }: ConnectionManagerProps) {
  const [deviceName, setDeviceName] = useState('');
  const [remoteOffer, setRemoteOffer] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateOffer = async () => {
    if (!deviceName.trim()) {
      toast.error('Please enter a device name');
      return;
    }
    await webrtc.createOffer(deviceName.trim());
    toast.success('Connection code generated!');
  };

  const handleAcceptOffer = async () => {
    if (!remoteOffer.trim()) {
      toast.error('Please paste a connection code');
      return;
    }
    try {
      await webrtc.acceptOffer(remoteOffer.trim());
      toast.success('Connected successfully!');
    } catch (error) {
      toast.error('Failed to connect. Please check the connection code.');
    }
  };

  const handleCopyOffer = async () => {
    if (webrtc.localOffer) {
      await navigator.clipboard.writeText(webrtc.localOffer);
      setCopied(true);
      toast.success('Connection code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    webrtc.disconnect();
    toast.info('Disconnected from peer');
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className={webrtc.isConnected ? 'border-primary' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">Connection Status</CardTitle>
              <CardDescription>
                {webrtc.isConnected
                  ? `Connected to ${webrtc.remotePeerName || 'peer'}`
                  : 'Not connected'}
              </CardDescription>
            </div>
            <Badge variant={webrtc.isConnected ? 'default' : 'secondary'} className="gap-1.5">
              {webrtc.isConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        {webrtc.isConnected && (
          <CardContent>
            <Button variant="destructive" onClick={handleDisconnect} className="w-full">
              Disconnect
            </Button>
          </CardContent>
        )}
      </Card>

      {!webrtc.isConnected && (
        <>
          {/* Create Connection */}
          <Card>
            <CardHeader>
              <CardTitle>Create Connection</CardTitle>
              <CardDescription>
                Generate a connection code to share with another device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Your Device Name</Label>
                <Input
                  id="deviceName"
                  placeholder="e.g., My Laptop"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  disabled={webrtc.isCreatingOffer}
                />
              </div>

              <Button
                onClick={handleCreateOffer}
                disabled={webrtc.isCreatingOffer || !deviceName.trim()}
                className="w-full"
              >
                {webrtc.isCreatingOffer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Connection Code'
                )}
              </Button>

              {webrtc.localOffer && (
                <div className="space-y-2">
                  <Label>Connection Code</Label>
                  <div className="relative">
                    <Textarea
                      value={webrtc.localOffer}
                      readOnly
                      className="min-h-[120px] font-mono text-xs pr-12"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-2"
                      onClick={handleCopyOffer}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this code with the other device to establish a connection
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Join Connection */}
          <Card>
            <CardHeader>
              <CardTitle>Join Connection</CardTitle>
              <CardDescription>
                Paste a connection code from another device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="remoteOffer">Connection Code</Label>
                <Textarea
                  id="remoteOffer"
                  placeholder="Paste the connection code here..."
                  value={remoteOffer}
                  onChange={(e) => setRemoteOffer(e.target.value)}
                  className="min-h-[120px] font-mono text-xs"
                  disabled={webrtc.isConnecting}
                />
              </div>

              <Button
                onClick={handleAcceptOffer}
                disabled={webrtc.isConnecting || !remoteOffer.trim()}
                className="w-full"
              >
                {webrtc.isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
