import { hash } from 'bcrypt-ts';
import { z } from 'zod';
import { createUser, getUser } from '@/lib/db/queries';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = registerSchema.parse(body);

    // Check if user already exists
    const existingUsers = await getUser(email);
    if (existingUsers.length > 0) {
      return new Response(
        JSON.stringify({ message: 'An account with this email already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create the user
    await createUser(email, hashedPassword);

    return new Response(
      JSON.stringify({ message: 'Account created successfully' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ message: error.errors[0].message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Registration failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}