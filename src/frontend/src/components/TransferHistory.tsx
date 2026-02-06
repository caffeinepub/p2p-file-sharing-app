import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { File, Upload, Download, Clock } from 'lucide-react';
import { useTransferHistory } from '@/hooks/useTransferHistory';
import { formatFileSize } from '@/lib/utils';

export function TransferHistory() {
  const { history } = useTransferHistory();

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No transfer history yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer History</CardTitle>
        <CardDescription>Your recent file transfers</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    item.type === 'sent'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent text-accent-foreground'
                  }`}
                >
                  {item.type === 'sent' ? (
                    <Upload className="h-5 w-5" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium truncate">{item.fileName}</p>
                    <Badge variant={item.status === 'completed' ? 'default' : 'destructive'}>
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <File className="h-3 w-3" />
                    <span>{formatFileSize(item.fileSize)}</span>
                    <span>•</span>
                    <span>{item.peerName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
