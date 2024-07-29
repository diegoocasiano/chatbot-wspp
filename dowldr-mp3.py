from flask import Flask, request, jsonify
from pytube import YouTube
import ffmpeg
import os

app = Flask(__name__)

@app.route('/download-mp3', methods=['POST'])
def download():
    try:
        # URL del video a descargar
        yt_link = request.json['link']

        # Obtengo el título del video con pytube
        yt = YouTube(yt_link)
        video_title = yt.title
        print(f"Descargando audio de: {video_title}")
        
        # Descargar el audio desde YouTube con pytube
        audio_streams = yt.streams.filter(only_audio=True).order_by('abr').desc()
        top_abr_stream = audio_streams.first()

        # Descargamos el stream seleccionado y lo guardamos como audio.webm
        top_abr_stream.download(filename='audio.webm')

        # Convertimos el archivo webm a mp3 con ffmpeg
        input_file = ffmpeg.input('audio.webm')
        output_file = input_file.output(f'{video_title}.mp3')
        output_file.run(overwrite_output=True)

        # Eliminar el archivo temporal .webm
        os.remove('audio.webm')

        print(f"Descarga exitosa: {video_title}.mp3")
        return jsonify({"message": "Descarga exitosa", "file_name": f'{video_title}.mp3'}), 200

    except Exception as e:
        print(f"Error al descargar el audio: {str(e)}")
        return jsonify({"error": f"Error al descargar el audio: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001)
