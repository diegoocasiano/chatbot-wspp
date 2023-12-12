from flask import Flask, request, jsonify
from todoist_api_python.api import TodoistAPI

app = Flask(__name__)
api = TodoistAPI("06e263cf525c59a66aea7da335227747ffd25694")

@app.route('/add-idea', methods=['POST'])
def add_idea():
    try:
        content = request.json['idea']

        task = api.add_task(
            content= content,
            project_id= "2324691310",
        )
        print(task)
        return "Task added successfully"
    
    except Exception as error:
        print("Error:", error)
        return jsonify({"error": "Error adding task to Todoist"}), 500

if __name__ == '__main__': 
    app.run(debug=True)   