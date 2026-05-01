'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, X, User, Building2, FileText, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

type SearchResult = {
  id: string;
  type: 'buyer' | 'vendor' | 'document' | 'event';
  title: string;
  subtitle: string;
  url: string;
};

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    // Mock search results - in production, this would call an API
    const mockResults: SearchResult[] = [
      { id: '1', type: 'buyer', title: 'Acme Corp', subtitle: 'John Smith', url: '/dashboard/buyers/1' },
      { id: '2', type: 'vendor', title: 'Tech Supplies Inc', subtitle: 'Contact: Jane Doe', url: '/dashboard/vendors/1' },
      { id: '3', type: 'document', title: 'Contract_2024.pdf', subtitle: 'Module: buyers', url: '/dashboard/documents/1' },
      { id: '4', type: 'event', title: 'Team Meeting', subtitle: '2024-01-15', url: '/dashboard/calendar' },
    ];

    const filtered = mockResults.filter(
      (r) => r.title.toLowerCase().includes(value.toLowerCase()) || r.subtitle.toLowerCase().includes(value.toLowerCase())
    );
    setResults(filtered);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'buyer': return <User className="w-4 h-4" />;
      case 'vendor': return <Building2 className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <Search className="w-4 h-4 mr-2" />
        Search...
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50">
      <Card className="w-full max-w-2xl mx-4 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search buyers, vendors, documents, events..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className="border-0 bg-transparent text-lg"
          />
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {query.length < 2 ? 'Type at least 2 characters to search' : 'No results found'}
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 text-left"
                >
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{result.title}</p>
                    <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
