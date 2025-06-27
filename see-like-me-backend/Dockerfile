FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ALL your specific model files
COPY models/production_adhd_model_20250626_070254.pkl ./models/
COPY models/dyslexia_ultimate_ensemble_20250626_042544.pkl ./models/
COPY models/dyslexia_preprocessing_20250626_042544.pkl ./models/
COPY models/dyslexia_ultimate_nn_20250626_042544.h5 ./models/
COPY models/production_autism_hybrid_enhanced_20250626_074724.pkl ./models/

# Copy application code
COPY . .

# Verify ALL your model files are present
RUN ls -la models/ && echo "✅ ALL your model files are present"

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
