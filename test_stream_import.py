
try:
    from mlx_lm import load, stream_generate
    print("✅ Imports successful")
except ImportError as e:
    print(f"❌ Import failed: {e}")
    exit(1)

# Mock model loading (don't actually load 32B model to save time/memory if just checking imports)
# But to test stream_generate we need a model. 
# We'll check if stream_generate is a function first.
print(f"stream_generate type: {type(stream_generate)}")
