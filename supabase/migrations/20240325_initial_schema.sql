-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_name TEXT,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_products_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sales_timestamp
BEFORE UPDATE ON sales
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Allow read access to all
CREATE POLICY read_products ON products FOR SELECT USING (true);
CREATE POLICY read_sales ON sales FOR SELECT USING (true);

-- Allow authenticated users to insert, update, and delete
CREATE POLICY insert_products ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY update_products ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY delete_products ON products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY insert_sales ON sales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY update_sales ON sales FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY delete_sales ON sales FOR DELETE USING (auth.role() = 'authenticated'); 