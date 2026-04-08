import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X } from 'lucide-react';

interface ProfilePhotoUploadProps {
  currentPhoto?: string;
  fullName?: string;
  onPhotoChange: (photoUrl: string) => void;
}

export function ProfilePhotoUpload({ currentPhoto, fullName, onPhotoChange }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size should be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || !fileInputRef.current?.files?.[0]) return;

    setIsUploading(true);
    
    try {
      const file = fileInputRef.current.files[0];
      
      // Convert to base64 and store
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        // Store the base64 image (in a real app, you'd upload to a storage service)
        // For now, we'll store it as a data URL
        onPhotoChange(base64String);
        
        toast({
          title: 'Success',
          description: 'Profile photo updated successfully.',
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onPhotoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Success',
      description: 'Profile photo removed.',
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <Avatar className="h-24 w-24">
              <AvatarImage src={preview || undefined} />
              <AvatarFallback className="text-2xl">
                {fullName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black bg-opacity-50 rounded-full h-24 w-24 flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2 w-full">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="profile-photo-upload"
            />
            
            <label htmlFor="profile-photo-upload">
              <Button variant="outline" className="w-full cursor-pointer" asChild>
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Choose Photo
                </span>
              </Button>
            </label>

            {preview && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading}
                  className="flex-1"
                >
                  {isUploading ? 'Uploading...' : 'Save Photo'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleRemove}
                  className="p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            JPG, PNG or GIF (max 5MB)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
