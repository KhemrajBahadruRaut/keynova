export type Testimonial = {
  id: number;
  name: string;
  client_type: string;
  rating: number;
  quote: string;
  created_at: string;
};

export type TestimonialStatus = "pending" | "approved" | "declined";

export type AdminTestimonial = Testimonial & {
  email: string;
  status: TestimonialStatus;
  consented_at: string;
  reviewed_at: string | null;
  updated_at: string;
};
