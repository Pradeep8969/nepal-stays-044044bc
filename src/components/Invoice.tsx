import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format, differenceInDays } from 'date-fns';
import { CalendarDays, Users, MapPin, Phone, Mail, Building, CreditCard, FileText, Printer } from 'lucide-react';

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
  hotels: { 
    name: string; 
    location: string; 
    image_url: string;
    description?: string;
    rating?: number;
  } | null;
}

interface InvoiceProps {
  booking: BookingWithHotel;
  userProfile?: {
    full_name: string;
    email: string;
    phone?: string;
  };
}

export default function Invoice({ booking, userProfile }: InvoiceProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  
  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 1000);
  };

  const nights = differenceInDays(new Date(booking.check_out_date), new Date(booking.check_in_date));
  const pricePerNight = booking.total_price / nights;

  return (
    <div className="space-y-4">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          /* Force light colors for printing */
          .print-area {
            background: white !important;
            color: black !important;
          }
          .print-area * {
            color: black !important;
            border-color: black !important;
          }
          .print-area .text-foreground {
            color: #000000 !important;
          }
          .print-area .text-muted-foreground {
            color: #666666 !important;
          }
          .print-area .bg-background {
            background: white !important;
          }
          .print-area .border {
            border-color: #000000 !important;
          }
        }
      `}</style>
      
      <div className="flex justify-end no-print">
        <Button 
          onClick={handlePrint} 
          disabled={isPrinting}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          {isPrinting ? 'Printing...' : 'Print Invoice'}
        </Button>
      </div>

      <div className="bg-background print-area">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">INVOICE</h1>
                  <p className="text-muted-foreground">Invoice #{booking.id}</p>
                </div>
                <div className="text-right">
                  <div className="mb-4">
                    <img 
                      src="/logo.svg" 
                      alt="Nepal Stays" 
                      className="h-12 mx-auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <h2 className="text-xl font-bold text-foreground">Nepal Stays</h2>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Kathmandu, Nepal</p>
                    <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> +977-1-1234567</p>
                    <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> info@nepalstays.com</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Customer and Hotel Information */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Customer Information
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{userProfile?.full_name || 'Guest User'}</p>
                  <p className="text-muted-foreground">{userProfile?.email || 'N/A'}</p>
                  <p className="text-muted-foreground">{userProfile?.phone || booking.guest_phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" /> Hotel Information
                </h3>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{booking.hotels?.name}</p>
                  <p className="text-muted-foreground">{booking.hotels?.location}</p>
                  {booking.hotels?.rating && (
                    <p className="text-muted-foreground">Rating: {booking.hotels.rating} stars</p>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="mb-8">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Booking Details
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Check-in Date</p>
                  <p className="font-medium">{format(new Date(booking.check_in_date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Check-out Date</p>
                  <p className="font-medium">{format(new Date(booking.check_out_date), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Room Type</p>
                  <p className="font-medium">{booking.room_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Number of Guests</p>
                  <p className="font-medium">{booking.guests} guest(s)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Number of Nights</p>
                  <p className="font-medium">{nights} night(s)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Hotel Image and Description */}
            {booking.hotels?.image_url && (
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-3">Hotel</h3>
                <div className="flex gap-4">
                  <img 
                    src={booking.hotels.image_url} 
                    alt={booking.hotels.name} 
                    className="h-32 w-48 rounded-lg object-cover"
                  />
                  {booking.hotels.description && (
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{booking.hotels.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="mb-8">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Payment Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room Rate ({nights} nights × ${pricePerNight.toFixed(2)})</span>
                  <span>${booking.total_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxes & Fees</span>
                  <span>$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span className="text-lg">${booking.total_price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="mb-8">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Terms & Conditions
              </h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. This invoice is for booking confirmation purposes.</p>
                <p>2. Cancellation policy applies as per hotel terms.</p>
                <p>3. Please present this invoice at check-in.</p>
                <p>4. For any queries, contact our support team.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Thank you for choosing Nepal Stays!</p>
              <p>Booking Date: {format(new Date(booking.created_at), 'MMMM d, yyyy')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
