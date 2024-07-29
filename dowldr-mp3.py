from flask import Flask, request, jsonify
from pytube import YouTube
import yt_dlp
import ffmpeg

app = Flask(__name__)

@app.route('/download-mp3', methods=['POST'])
def download():
    try:
        # URL del video a descargar
        yt_link = request.json['link']

        # Obtengo el titulo del video con yt_dlp
        def get_video_title(yt_link):
            with yt_dlp.YoutubeDL() as ydl:
                info = ydl.extract_info(yt_link, download=False)
                return info.get('title', None)

        video_title = get_video_title(yt_link)
        
        # Descargar el audio desde YouTube con pytube
        yt = YouTube(yt_link)

        # Ordenamos los streams (o flujos) de mayor a menor según su bitrate
        audio_streams = yt.streams.filter(only_audio=True).order_by('abr').desc()

        # Seleccionamos el stream (o flujo) con mayor bitrate
        top_abr_stream = audio_streams.first()

        # Descargamos el stream (o flujo) seleccionado y lo guardamos como audio.webm
        top_abr_stream.download(filename='audio.webm')

        # Cargamos el archivo, descargado por pytube, con ffmpeg
        input_file = ffmpeg.input('audio.webm')

        # Convertimos el archivo webm a mp3
        output_file = input_file.output(f'{video_title}.mp3')
        
        # Inicia la conversión con ffmpeg
        output_file.run(overwrite_output=True)

        print(f"Descarga exitosa: {video_title}.mp3")
        return jsonify({"message": "Descarga exitosa", "file_name": f'{video_title}.mp3'}), 200

    except Exception as e:
        print(f"Error al descargar el audio: {str(e)}")
        return jsonify({"error": "Error al descargar el audio"}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001)