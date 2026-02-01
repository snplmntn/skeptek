-- Allow users to create their own profile if it's missing (Lazy Creation)
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
