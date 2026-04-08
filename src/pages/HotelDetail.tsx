import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Star, Users, Calendar, Phone } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import { differenceInDays, format, addDays } from 'date-fns';

export default function HotelDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [hotel, setHotel] = useState<Tables<'hotels'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [roomType, setRoomType] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      const { data } = await supabase.from('hotels').select('*').eq('id', id).single();
      if (data) {
        setHotel(data);
        const types = data.room_types as string[];
        if (types.length > 0) setRoomType(types[0]);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const nights = checkIn && checkOut ? differenceInDays(new Date(checkOut), new Date(checkIn)) : 0;
  const totalPrice = hotel ? nights * hotel.price_per_night : 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const minCheckOut = checkIn ? format(addDays(new Date(checkIn), 1), 'yyyy-MM-dd') : today;

  const handleBook = async () => {
    if (!user) { navigate('/auth'); return; }
    if (nights <= 0) { toast({ title: 'Invalid dates', description: 'Check-out must be after check-in.', variant: 'destructive' }); return; }
    if (!guestPhone || guestPhone.length < 10) { 
      toast({ title: 'Invalid phone', description: 'Please enter a valid phone number for contact.', variant: 'destructive' }); 
      return; 
    }
    if (!hotel) return;

    setBooking(true);

    // Check availability
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('hotel_id', hotel.id)
      .eq('room_type', roomType)
      .eq('status', 'confirmed')
      .lt('check_in_date', checkOut)
      .gt('check_out_date', checkIn);

    if ((count ?? 0) >= hotel.rooms_available) {
      toast({ title: 'Not available', description: 'No rooms available for the selected dates.', variant: 'destructive' });
      setBooking(false);
      return;
    }

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      hotel_id: hotel.id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      guests,
      room_type: roomType,
      total_price: totalPrice,
      guest_phone: guestPhone,
    });

    if (error) {
      toast({ title: 'Booking failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Booking confirmed!', description: `${hotel.name} - ${nights} night(s) for $${totalPrice}` });
      navigate('/my-bookings');
    }
    setBooking(false);
  };

  if (loading) return <div className="container mx-auto px-4 py-12"><div className="h-96 animate-pulse rounded-lg bg-muted" /></div>;
  if (!hotel) return <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">Hotel not found.</div>;

  const roomTypes = hotel.room_types as string[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Hotel info */}
        <div className="lg:col-span-2">
          <div className="mb-6 overflow-hidden rounded-lg">
            <img src={hotel.image_url} alt={hotel.name} className="h-72 w-full object-cover sm:h-96" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">{hotel.name}</h1>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{hotel.location}</div>
            <div className="flex items-center gap-1 text-warning"><Star className="h-4 w-4 fill-current" />{hotel.rating}</div>
            <span className="text-lg font-bold text-primary">${hotel.price_per_night}/night</span>
          </div>
          <p className="mb-6 leading-relaxed text-muted-foreground">{hotel.description}</p>

          <h2 className="mb-3 text-lg font-semibold text-foreground">Room Types</h2>
          <div className="flex flex-wrap gap-2">
            {roomTypes.map(type => (
              <span key={type} className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground">{type}</span>
            ))}
          </div>
        </div>

        {/* Booking card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Book This Hotel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Check-in</Label>
              <Input type="date" min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Check-out</Label>
              <Input type="date" min={minCheckOut} value={checkOut} onChange={e => setCheckOut(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Guests</Label>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input type="number" min={1} max={10} value={guests} onChange={e => setGuests(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Room Type</Label>
              <Select value={roomType} onValueChange={setRoomType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roomTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Guest Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Input 
                  type="tel" 
                  placeholder="+977-XXXXXXXXX" 
                  value={guestPhone} 
                  onChange={e => setGuestPhone(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">Required for contact during your stay</p>
            </div>

            {nights > 0 && (
              <div className="rounded-lg bg-accent p-3">
                <div className="flex justify-between text-sm"><span>{nights} night(s) × ${hotel.price_per_night}</span><span className="font-semibold">${totalPrice}</span></div>
              </div>
            )}

            <Button className="w-full" onClick={handleBook} disabled={booking || !checkIn || !checkOut}>
              {booking ? 'Booking...' : user ? 'Confirm Booking' : 'Sign in to Book'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
