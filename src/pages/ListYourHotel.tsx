import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building, MapPin, Phone, Mail, Star, Upload, CheckCircle, Hotel } from 'lucide-react';

interface HotelFormData {
  name: string;
  location: string;
  description: string;
  rating: string;
  image_url: string;
  contact_phone: string;
  contact_email: string;
  website: string;
  amenities: string;
  room_types: string;
  price_range: string;
  establishment_year: string;
  special_features: string;
}

export default function ListYourHotel() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<HotelFormData>({
    name: '',
    location: '',
    description: '',
    rating: '',
    image_url: '',
    contact_phone: '',
    contact_email: '',
    website: '',
    amenities: '',
    room_types: '',
    price_range: '',
    establishment_year: '',
    special_features: ''
  });

  const handleInputChange = (field: keyof HotelFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save to hotel_submissions table
      const { data, error } = await supabase
        .from('hotel_submissions')
        .insert({
          hotel_name: formData.name,
          location: formData.location,
          description: formData.description,
          rating: formData.rating ? parseInt(formData.rating) : null,
          image_url: formData.image_url,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          website: formData.website,
          amenities: formData.amenities,
          room_types: formData.room_types,
          price_range: formData.price_range,
          establishment_year: formData.establishment_year,
          special_features: formData.special_features,
          submission_data: formData // Store all form data as JSON
        })
        .select();

      if (error) {
        console.error('Submission error:', error);
        throw error;
      }

      console.log('Hotel submission successful:', data);
      
      setIsSubmitted(true);
      toast({
        title: 'Hotel Submitted Successfully!',
        description: 'Your hotel details have been submitted for review. We will contact you within 24-48 hours.',
      });
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        description: '',
        rating: '',
        image_url: '',
        contact_phone: '',
        contact_email: '',
        website: '',
        amenities: '',
        room_types: '',
        price_range: '',
        establishment_year: '',
        special_features: ''
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your hotel. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">
              Your hotel details have been submitted successfully. Our team will review your submission and contact you within 24-48 hours.
            </p>
            <Button onClick={() => setIsSubmitted(false)} className="w-full">
              Submit Another Hotel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Hotel className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">List Your Hotel</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join Nepal's premier hotel booking platform. Submit your hotel details and reach thousands of travelers looking for authentic Nepalese hospitality.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Hotel Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter hotel name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Kathmandu, Pokhara, Chitwan"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your hotel, its unique features, and what makes it special..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="rating">Star Rating *</Label>
                  <Select value={formData.rating} onValueChange={(value) => handleInputChange('rating', value)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Star</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="establishment_year">Establishment Year</Label>
                  <Input
                    id="establishment_year"
                    value={formData.establishment_year}
                    onChange={(e) => handleInputChange('establishment_year', e.target.value)}
                    placeholder="e.g., 2010"
                  />
                </div>
                <div>
                  <Label htmlFor="price_range">Price Range (per night)</Label>
                  <Input
                    id="price_range"
                    value={formData.price_range}
                    onChange={(e) => handleInputChange('price_range', e.target.value)}
                    placeholder="e.g., $50-150"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="+977-1-1234567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="hotel@example.com"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.yourhotel.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Hotel Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Hotel Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="image_url">Hotel Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/hotel-image.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Provide a URL to your hotel's main image
                </p>
              </div>

              <div>
                <Label htmlFor="amenities">Amenities</Label>
                <Textarea
                  id="amenities"
                  value={formData.amenities}
                  onChange={(e) => handleInputChange('amenities', e.target.value)}
                  placeholder="WiFi, Restaurant, Bar, Swimming Pool, Spa, Gym, Parking, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="room_types">Room Types</Label>
                <Textarea
                  id="room_types"
                  value={formData.room_types}
                  onChange={(e) => handleInputChange('room_types', e.target.value)}
                  placeholder="Standard Room, Deluxe Room, Suite, Family Room, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="special_features">Special Features</Label>
                <Textarea
                  id="special_features"
                  value={formData.special_features}
                  onChange={(e) => handleInputChange('special_features', e.target.value)}
                  placeholder="Mountain views, Garden, Traditional architecture, Cultural experiences, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-3 text-lg"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Hotel for Review
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Information Section */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Why List with Nepal Stays?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Reach thousands of travelers visiting Nepal</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Easy booking management system</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Competitive commission rates</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Professional marketing support</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>24/7 customer support</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Free listing with no upfront costs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
