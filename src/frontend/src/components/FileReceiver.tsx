import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, File, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { WebRTCHook } from '@/hooks/useWebRTC';
import { formatFileSize } from '@/lib/utils';

interface FileReceiverProps {
  webrtc: WebRTCHook;
}

export function FileReceiver({ webrtc }: FileReceiverProps) {
  const handleAcceptFile = (transferId: string) => {
    webrtc.acceptIncomingFile(transferId);
  };

  const handleRejectFile = (transferId: string) => {
    webrtc.rejectIncomingFile(transferId);
  };

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {webrtc.incomingFileRequests.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Incoming File Requests</CardTitle>
            <CardDescription>
              {webrtc.remotePeerName || 'A peer'} wants to send you files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {webrtc.incomingFileRequests.map((request) => (
              <div key={request.id} className="space-y-3 p-4 rounded-lg border bg-accent/50">
                <div className="flex items-start gap-3">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{request.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(request.fileSize)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptFile(request.id)}
                    className="flex-1"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleRejectFile(request.id)}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Transfers */}
      {webrtc.receivingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receiving Files</CardTitle>
            <CardDescription>Download progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {webrtc.receivingFiles.map((transfer) => (
              <div key={transfer.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{transfer.fileName}</span>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">
                    {transfer.progress}%
                  </Badge>
                </div>
                <Progress value={transfer.progress} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatFileSize(transfer.receivedBytes ?? 0)} / {formatFileSize(transfer.totalBytes)}
                  </span>
                  {transfer.speed && <span>{formatFileSize(transfer.speed)}/s</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Transfers */}
      {webrtc.completedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Recently received files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {webrtc.completedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  Saved
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {webrtc.incomingFileRequests.length === 0 &&
        webrtc.receivingFiles.length === 0 &&
        webrtc.completedFiles.length === 0 && (
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              Waiting for files from {webrtc.remotePeerName || 'the connected device'}...
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
