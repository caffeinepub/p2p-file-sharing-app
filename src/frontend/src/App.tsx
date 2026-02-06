import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FileTransferApp } from '@/components/FileTransferApp';

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <FileTransferApp />
          </main>
          <Footer />
          <Toaster />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
