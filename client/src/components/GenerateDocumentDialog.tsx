import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: string;
  language: 'en' | 'ar' | 'both';
  variables: string[];
  isActive: boolean;
}

interface GenerateDocumentDialogProps {
  trigger?: React.ReactNode;
  documentType?: 'price_offer' | 'order' | 'invoice';
  orderId?: string;
  priceOfferId?: string;
  clientId?: string;
  ltaId?: string;
  onDocumentGenerated?: (documentId: string, fileName: string) => void;
}

export function GenerateDocumentDialog({
  trigger,
  documentType = 'price_offer',
  orderId,
  priceOfferId,
  clientId,
  ltaId,
  onDocumentGenerated
}: GenerateDocumentDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load templates when dialog opens
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, documentType]);

  // Update variables when template changes
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find(t => t.id === selectedTemplate);
      if (template) {
        const initialVariables: Record<string, string> = {};
        template.variables.forEach(variable => {
          initialVariables[variable] = '';
        });
        setVariables(initialVariables);
      }
    }
  }, [selectedTemplate, templates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/templates?category=${documentType}`);
      if (!response.ok) throw new Error('Failed to load templates');
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }

    // Validate required variables
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      const missingVariables = template.variables.filter(variable => !variables[variable]?.trim());
      if (missingVariables.length > 0) {
        toast.error(`Please fill in all required variables: ${missingVariables.join(', ')}`);
        return;
      }
    }

    try {
      setGenerating(true);
      
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate,
          variables: Object.entries(variables).map(([key, value]) => ({ key, value })),
          language,
          orderId,
          priceOfferId,
          clientId,
          ltaId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate document');
      }

      const result = await response.json();
      
      toast.success('Document generated successfully!');
      
      if (onDocumentGenerated) {
        onDocumentGenerated(result.documentId, result.fileName);
      }

      // Download the generated document
      const downloadResponse = await fetch(`/api/documents/${result.documentId}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (downloadResponse.ok) {
        const { token } = await downloadResponse.json();
        const downloadUrl = `/api/documents/${result.documentId}/download?token=${token}`;
        window.open(downloadUrl, '_blank');
      }

      setOpen(false);
    } catch (error) {
      console.error('Error generating document:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Document from Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Select Template</Label>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading templates...
              </div>
            ) : (
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{language === 'ar' ? template.nameAr : template.nameEn}</span>
                        <Badge variant="secondary" className="ml-2">
                          {template.language}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={(value: 'en' | 'ar') => setLanguage(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Preview */}
          {selectedTemplateData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  {language === 'ar' ? selectedTemplateData.nameAr : selectedTemplateData.nameEn}
                </CardTitle>
                <CardDescription className="text-xs">
                  {language === 'ar' ? selectedTemplateData.descriptionAr : selectedTemplateData.descriptionEn}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{selectedTemplateData.category}</Badge>
                  <Badge variant="outline">{selectedTemplateData.language}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variables Input */}
          {selectedTemplateData && selectedTemplateData.variables.length > 0 && (
            <div className="space-y-4">
              <Label>Template Variables</Label>
              <div className="grid gap-4">
                {selectedTemplateData.variables.map((variable) => (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={variable} className="text-sm font-medium">
                      {variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                    {variable.toLowerCase().includes('notes') || variable.toLowerCase().includes('description') ? (
                      <Textarea
                        id={variable}
                        value={variables[variable] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                        placeholder={`Enter ${variable}...`}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={variable}
                        value={variables[variable] || ''}
                        onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))}
                        placeholder={`Enter ${variable}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedTemplate || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate & Download
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}