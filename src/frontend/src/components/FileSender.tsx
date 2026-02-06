import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { WebRTCHook } from '@/hooks/useWebRTC';
import { formatFileSize } from '@/lib/utils';

interface FileSenderProps {
  webrtc: WebRTCHook;
}

export function FileSender({ webrtc }: FileSenderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    for (const file of selectedFiles) {
      try {
        await webrtc.sendFile(file);
      } catch (error) {
        toast.error(`Failed to send ${file.name}`);
      }
    }
    
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Files</CardTitle>
          <CardDescription>
            Choose files to send to {webrtc.remotePeerName || 'the connected device'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">Click to select files</p>
            <p className="text-xs text-muted-foreground">or drag and drop files here</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <Badge variant="secondary">{formatFileSize(totalSize)}</Badge>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSendFiles} className="w-full" size="lg">
                <Send className="mr-2 h-4 w-4" />
                Send {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Transfers */}
      {webrtc.sendingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sending Files</CardTitle>
            <CardDescription>Transfer progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {webrtc.sendingFiles.map((transfer) => (
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
                    {formatFileSize(transfer.sentBytes ?? 0)} / {formatFileSize(transfer.totalBytes)}
                  </span>
                  {transfer.speed && <span>{formatFileSize(transfer.speed)}/s</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
