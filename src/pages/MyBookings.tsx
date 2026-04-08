import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, format } from 'date-fns';
import { CalendarDays, Users, FileText, Phone, X } from 'lucide-react';
import Invoice from '@/components/Invoice';

interface BookingWithHotel {
  id: string;
  check_in_date: string;
  check_out_date: string;
  guests: number;
  room_type: string;
  total_price: number;
  status: string;
  created_at: string;
  guest_phone: string;
  hotels: { name: string; location: string; image_url: string } | null;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone?: string;
}

export default function MyBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithHotel | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookings')
      .select('id, check_in_date, check_out_date, guests, room_type, total_price, status, created_at, guest_phone, hotels(name, location, image_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setBookings((data as unknown as BookingWithHotel[]) || []);
    setLoading(false);
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('user_id', user.id)
      .single();
    setUserProfile(data as UserProfile);
  };

  useEffect(() => { 
    fetchBookings(); 
    fetchUserProfile();
  }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Booking Cancelled', description: 'Your booking has been successfully cancelled.' });
      fetchBookings();
    }
  };

  const canCancel = (checkIn: string, status: string) => {
    const validStatuses = ['confirmed', 'pending', null, undefined, ''];
    return (validStatuses.includes(status) || !status) && differenceInDays(new Date(checkIn), new Date()) >= 2;
  };

  const getCancelReason = (checkIn: string, status: string) => {
    const daysUntilCheckIn = differenceInDays(new Date(checkIn), new Date());
    if (daysUntilCheckIn < 0) return "This booking has already passed";
    if (daysUntilCheckIn < 2) return "Cannot cancel within 48 hours of check-in";
    if (status === 'cancelled') return "This booking is already cancelled";
    return null;
  };

  const handleViewInvoice = (booking: BookingWithHotel) => {
    setSelectedBooking(booking);
    setShowInvoice(true);
  };

  if (loading) return <div className="container mx-auto px-4 py-12"><div className="h-40 animate-pulse rounded-lg bg-muted" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">My Bookings</h1>
      {bookings.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">You haven't made any bookings yet.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <Card key={b.id}>
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                {b.hotels && (
                  <img src={b.hotels.image_url} alt={b.hotels.name} className="h-24 w-32 rounded-md object-cover" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{b.hotels?.name}</h3>
                    <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>
                      {b.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{b.hotels?.location} · {b.room_type}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{format(new Date(b.check_in_date), 'MMM d')} → {format(new Date(b.check_out_date), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{b.guests} guest(s)</span>
                    {b.guest_phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{b.guest_phone}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-foreground">${b.total_price}</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewInvoice(b)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Invoice
                    </Button>
                    {canCancel(b.check_in_date, b.status) ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <X className="h-4 w-4" />
                            Cancel
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to cancel your booking at {b.hotels?.name}? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancel(b.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Cancel Booking
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button variant="outline" size="sm" disabled className="gap-2" title={getCancelReason(b.check_in_date, b.status) || 'Cannot cancel'}>
                        <X className="h-4 w-4" />
                        Cannot Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Invoice Modal */}
      {showInvoice && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex justify-between items-center border-b bg-white p-4">
              <h2 className="text-xl font-semibold">Booking Invoice</h2>
              <Button 
                variant="outline" 
                onClick={() => setShowInvoice(false)}
              >
                Close
              </Button>
            </div>
            <div className="p-4">
              <Invoice 
                booking={selectedBooking} 
                userProfile={userProfile || undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
