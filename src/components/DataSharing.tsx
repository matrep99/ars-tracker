
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CampaignRecord } from '@/lib/campaignStorage';
import { Copy, Share } from 'lucide-react';

interface DataSharingProps {
  campaigns: CampaignRecord[];
}

export const DataSharing = ({ campaigns }: DataSharingProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [sharedUrl, setSharedUrl] = useState('');
  const { toast } = useToast();

  const shareCampaigns = async () => {
    setIsSharing(true);
    
    try {
      const dataToShare = {
        campaigns,
        sharedAt: new Date().toISOString(),
        readOnly: true
      };

      // Using JSONBin.io as a simple pastebin service
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': '$2a$10$3QX2VRm7Pf7nXkEfVcTe9eZJQZ5GqEVF3QZ5GqEVF3QZ5GqEVF3Q',
        },
        body: JSON.stringify(dataToShare)
      });

      if (response.ok) {
        const result = await response.json();
        const shareableUrl = `${window.location.origin}?shared=${result.metadata.id}`;
        setSharedUrl(shareableUrl);
        
        toast({
          title: "Link di condivisione creato",
          description: "I tuoi dati sono ora condivisibili tramite il link generato"
        });
      } else {
        throw new Error('Errore nella creazione del link');
      }
    } catch (error) {
      console.error('Errore nella condivisione:', error);
      
      // Fallback: use base64 encoding for local sharing
      const dataToShare = {
        campaigns,
        sharedAt: new Date().toISOString(),
        readOnly: true
      };
      
      const encodedData = btoa(JSON.stringify(dataToShare));
      const shareableUrl = `${window.location.origin}?data=${encodedData}`;
      setSharedUrl(shareableUrl);
      
      toast({
        title: "Link di condivisione creato",
        description: "I tuoi dati sono ora condivisibili tramite il link generato (modalità locale)"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sharedUrl);
      toast({
        title: "Link copiato",
        description: "Il link è stato copiato negli appunti"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile copiare il link negli appunti",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share className="h-5 w-5" />
          Condividi Dati
        </CardTitle>
        <CardDescription>
          Genera un link pubblico per condividere i tuoi dati in modalità sola lettura
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sharedUrl ? (
          <Button 
            onClick={shareCampaigns} 
            disabled={isSharing || campaigns.length === 0}
            className="w-full"
          >
            {isSharing ? 'Creazione link...' : 'Genera Link di Condivisione'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input 
                value={sharedUrl} 
                readOnly 
                className="bg-gray-50"
              />
              <Button onClick={copyToClipboard} size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Chiunque abbia questo link potrà visualizzare i tuoi dati in modalità sola lettura.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
