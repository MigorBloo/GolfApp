from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import os
import requests
import logging

app = Flask(__name__)
CORS(app,resources={
    r"/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.route('/api/field', methods=['GET'])
def get_field():
    try:
        logger.info("Received request for /api/field")
        url = 'https://feeds.datagolf.com/field-updates?tour=pga&file_format=json&key=52212d2beeb04f0e0fc30a5f07ca'
        response = requests.get(url)
        data = response.json()
        logger.info("Field data fetched successfully")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Error in get_field: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/schedule', methods=['GET'])
def get_schedule():
    try:
        file_path = os.path.join('Data', 'Schedule.xlsx')
        logger.info(f"Attempting to read Excel file from: {file_path}")
        
        df = pd.read_excel(file_path)
        df['StartDate'] = pd.to_datetime(df['StartDate']).dt.strftime('%d/%m/%Y')
        schedule_data = df.to_dict('records')
        
        return jsonify({
            "schedule": schedule_data
        })
        
    except Exception as e:
        logger.error(f"Error in get_schedule: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)