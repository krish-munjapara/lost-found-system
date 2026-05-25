import sys
import traceback

sys.path.insert(0, './backend')

with open('import_error.log', 'w', encoding='utf-8') as f:
    try:
        import app.main
        f.write("Backend import successful\n")
    except Exception as e:
        traceback.print_exc(file=f)
