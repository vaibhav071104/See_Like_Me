import os

# Define the root path on E drive
root_path = r'E:\see-like-me-backend'

# Define all directories to create
directories = [
    root_path,
    os.path.join(root_path, 'app'),
    os.path.join(root_path, 'app', 'models'),
    os.path.join(root_path, 'app', 'api'),
    os.path.join(root_path, 'app', 'core'),
    os.path.join(root_path, 'app', 'utils'),
    os.path.join(root_path, 'models'),
    os.path.join(root_path, 'logs')
]

# Define all files to create (empty files)
files = [
    os.path.join(root_path, 'app', '__init__.py'),
    os.path.join(root_path, 'app', 'models', '__init__.py'),
    os.path.join(root_path, 'app', 'api', '__init__.py'),
    os.path.join(root_path, 'app', 'core', '__init__.py'),
    os.path.join(root_path, 'app', 'utils', '__init__.py'),
    os.path.join(root_path, 'app', 'main.py'),
    os.path.join(root_path, 'app', 'models', 'disability_detector.py'),
    os.path.join(root_path, 'app', 'models', 'model_loader.py'),
    os.path.join(root_path, 'app', 'api', 'routes.py'),
    os.path.join(root_path, 'app', 'api', 'websocket.py'),
    os.path.join(root_path, 'app', 'core', 'config.py'),
    os.path.join(root_path, 'app', 'core', 'redis_client.py'),
    os.path.join(root_path, 'app', 'utils', 'preprocessing.py'),
    os.path.join(root_path, 'models', 'production_adhd_model_20250626_070254.pkl'),
    os.path.join(root_path, 'models', 'dyslexia_ultimate_ensemble_20250626_042544.pkl'),
    os.path.join(root_path, 'models', 'dyslexia_preprocessing_20250626_042544.pkl'),
    os.path.join(root_path, 'models', 'dyslexia_ultimate_nn_20250626_042544.h5'),
    os.path.join(root_path, 'models', 'production_autism_hybrid_enhanced_20250626_074724.pkl'),
    os.path.join(root_path, 'requirements.txt'),
    os.path.join(root_path, 'Dockerfile'),
    os.path.join(root_path, 'docker-compose.yml'),
    os.path.join(root_path, '.env')
]

# Create directories
for directory in directories:
    os.makedirs(directory, exist_ok=True)

# Create empty files
for file in files:
    with open(file, 'a') as f:
        pass

print("✅ Created root folder and all subfolders and files in E drive.")
print("📁 Backend structure created at: E:\\see-like-me-backend")
