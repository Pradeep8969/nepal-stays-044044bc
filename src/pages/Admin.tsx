import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Eye, Check, X, Users, Calendar, Building, Hotel as HotelIcon, AlertCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface HotelSubmission {
  id: string;
  hotel_name: string;
  location: string;
  description: string;
  rating: number | null;
  image_url: string | null;
  contact_phone: string;
  contact_email: string;
  website: string | null;
  amenities: string | null;
  room_types: string | null;
  price_range: string | null;
  establishment_year: string | null;
  special_features: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  submission_data: any;
}

const emptyHotel = { name: '', location: '', description: '', price_per_night: 0, rating: 4.0, image_url: '', rooms_available: 10, room_types: '["Standard", "Deluxe"]' };

export default function Admin() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [hotels, setHotels] = useState<Tables<'hotels'>[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<HotelSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyHotel);
  const [activeTab, setActiveTab] = useState<'hotels' | 'bookings' | 'submissions'>('submissions');
  const [selectedSubmission, setSelectedSubmission] = useState<HotelSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ status: 'approved' as 'approved' | 'rejected', admin_notes: '' });

  const fetchHotels = async () => {
    const { data } = await supabase.from('hotels').select('*').order('created_at', { ascending: false });
    setHotels(data || []);
  };

  const fetchBookings = async () => {
    // Simple query without joins to avoid 400 errors
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    setBookings(data || []);
  };

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('hotel_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });
    setSubmissions(data || []);
  };

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchHotels(), fetchBookings(), fetchSubmissions()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (!isAdmin) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Access denied. Admin only.</div>;

  const openNew = () => { setForm(emptyHotel); setEditing(null); setDialogOpen(true); };
  const openEdit = (h: Tables<'hotels'>) => {
    setForm({
      name: h.name, location: h.location, description: h.description,
      price_per_night: h.price_per_night, rating: h.rating,
      image_url: h.image_url, rooms_available: h.rooms_available,
      room_types: JSON.stringify(h.room_types),
    });
    setEditing(h.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    let roomTypes: string[];
    try { roomTypes = JSON.parse(form.room_types); } catch { toast({ title: 'Invalid room types JSON', variant: 'destructive' }); return; }

    const payload = { ...form, price_per_night: Number(form.price_per_night), rating: Number(form.rating), rooms_available: Number(form.rooms_available), room_types: roomTypes };

    if (editing) {
      const { error } = await supabase.from('hotels').update(payload).eq('id', editing);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Hotel updated' });
    } else {
      const { error } = await supabase.from('hotels').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Hotel added' });
    }
    setDialogOpen(false);
    fetchHotels();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this hotel?')) return;
    const { error } = await supabase.from('hotels').delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Hotel deleted' });
    fetchHotels();
  };

  const handleReview = async () => {
    if (!selectedSubmission) return;

    const { error } = await supabase
      .from('hotel_submissions')
      .update({
        status: reviewForm.status,
        admin_notes: reviewForm.admin_notes,
        reviewed_at: new Date().toISOString(),
        reviewed_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', selectedSubmission.id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    // If approved, add to hotels table
    if (reviewForm.status === 'approved') {
      const hotelData = {
        name: selectedSubmission.hotel_name,
        location: selectedSubmission.location,
        description: selectedSubmission.description,
        rating: selectedSubmission.rating || 4.0,
        image_url: selectedSubmission.image_url || '',
        price_per_night: 100, // Default price
        rooms_available: 10, // Default rooms
        room_types: ['Standard', 'Deluxe'] // Default room types
      };

      const { error: hotelError } = await supabase.from('hotels').insert(hotelData);
      if (hotelError) {
        toast({ title: 'Error adding hotel', description: hotelError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Hotel approved and added successfully' });
      }
    } else {
      toast({ title: 'Hotel submission rejected' });
    }

    setReviewDialogOpen(false);
    setSelectedSubmission(null);
    setReviewForm({ status: 'approved', admin_notes: '' });
    fetchSubmissions();
    fetchHotels();
  };

  const updateField = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage hotels, bookings, and hotel submissions</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submissions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Hotel Submissions ({submissions.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('hotels')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'hotels'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Manage Hotels ({hotels.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      ) : (
        <>
          {/* Hotel Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Hotel Submissions</h2>
              </div>
              {submissions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hotel submissions yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <Card key={submission.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{submission.hotel_name}</h3>
                              <Badge variant={submission.status === 'pending' ? 'secondary' : submission.status === 'approved' ? 'default' : 'destructive'}>
                                {submission.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div><span className="font-medium">Location:</span> {submission.location}</div>
                              <div><span className="font-medium">Contact:</span> {submission.contact_phone}</div>
                              <div><span className="font-medium">Email:</span> {submission.contact_email}</div>
                              <div><span className="font-medium">Rating:</span> {submission.rating || 'Not specified'}</div>
                              <div><span className="font-medium">Price Range:</span> {submission.price_range || 'Not specified'}</div>
                              <div><span className="font-medium">Submitted:</span> {format(new Date(submission.submitted_at), 'MMM d, yyyy')}</div>
                            </div>
                            {submission.description && (
                              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{submission.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedSubmission(submission); setReviewDialogOpen(true); }}>
                              <Eye className="h-4 w-4 mr-1" /> Review
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">All Bookings</h2>
              </div>
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">Hotel ID: {booking.hotel_id}</h3>
                              <Badge variant="outline">{booking.status}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                              <div><span className="font-medium">User ID:</span> {booking.user_id}</div>
                              <div><span className="font-medium">Check-in:</span> {format(new Date(booking.check_in_date), 'MMM d, yyyy')}</div>
                              <div><span className="font-medium">Check-out:</span> {format(new Date(booking.check_out_date), 'MMM d, yyyy')}</div>
                              <div><span className="font-medium">Guests:</span> {booking.guests}</div>
                              <div><span className="font-medium">Room Type:</span> {booking.room_type}</div>
                              <div><span className="font-medium">Phone:</span> {booking.guest_phone}</div>
                              <div><span className="font-medium">Total:</span> ${booking.total_price}</div>
                              <div><span className="font-medium">Created:</span> {format(new Date(booking.created_at), 'MMM d, yyyy')}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Hotels Tab */}
          {activeTab === 'hotels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Manage Hotels</h2>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Add Hotel</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Hotel' : 'Add Hotel'}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Name</Label><Input value={form.name} onChange={e => updateField('name', e.target.value)} /></div>
                      <div><Label>Location</Label><Input value={form.location} onChange={e => updateField('location', e.target.value)} /></div>
                      <div><Label>Description</Label><Textarea value={form.description} onChange={e => updateField('description', e.target.value)} /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Price/Night ($)</Label><Input type="number" value={form.price_per_night} onChange={e => updateField('price_per_night', e.target.value)} /></div>
                        <div><Label>Rating</Label><Input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={e => updateField('rating', e.target.value)} /></div>
                      </div>
                      <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => updateField('image_url', e.target.value)} /></div>
                      <div><Label>Rooms Available</Label><Input type="number" value={form.rooms_available} onChange={e => updateField('rooms_available', e.target.value)} /></div>
                      <div><Label>Room Types (JSON array)</Label><Input value={form.room_types} onChange={e => updateField('room_types', e.target.value)} /></div>
                      <Button className="w-full" onClick={handleSave}>{editing ? 'Update' : 'Add'} Hotel</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {hotels.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <HotelIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hotels yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {hotels.map((h) => (
                    <Card key={h.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <img src={h.image_url} alt={h.name} className="h-16 w-20 rounded-md object-cover" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{h.name}</h3>
                          <p className="text-sm text-muted-foreground">{h.location} · ${h.price_per_night}/night · {h.rooms_available} rooms</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEdit(h)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="outline" size="icon" onClick={() => handleDelete(h.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Hotel Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hotel Name</Label>
                  <p className="font-medium">{selectedSubmission.hotel_name}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="font-medium">{selectedSubmission.location}</p>
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <p className="font-medium">{selectedSubmission.contact_phone}</p>
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <p className="font-medium">{selectedSubmission.contact_email}</p>
                </div>
                <div>
                  <Label>Rating</Label>
                  <p className="font-medium">{selectedSubmission.rating || 'Not specified'}</p>
                </div>
                <div>
                  <Label>Price Range</Label>
                  <p className="font-medium">{selectedSubmission.price_range || 'Not specified'}</p>
                </div>
              </div>
              
              {selectedSubmission.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.description}</p>
                </div>
              )}
              
              {selectedSubmission.amenities && (
                <div>
                  <Label>Amenities</Label>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.amenities}</p>
                </div>
              )}
              
              {selectedSubmission.room_types && (
                <div>
                  <Label>Room Types</Label>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.room_types}</p>
                </div>
              )}
              
              <div className="space-y-3">
                <Label>Review Decision</Label>
                <Select value={reviewForm.status} onValueChange={(value: 'approved' | 'rejected') => setReviewForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approve</SelectItem>
                    <SelectItem value="rejected">Reject</SelectItem>
                  </SelectContent>
                </Select>
                
                <Label>Admin Notes (Optional)</Label>
                <Textarea 
                  value={reviewForm.admin_notes}
                  onChange={e => setReviewForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                  placeholder="Add any notes about this decision..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleReview} className="flex-1">
                  {reviewForm.status === 'approved' ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                  {reviewForm.status === 'approved' ? 'Approve & Add Hotel' : 'Reject Submission'}
                </Button>
                <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
