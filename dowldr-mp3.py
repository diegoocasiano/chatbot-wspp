from flask import Flask, request, jsonify
from pytube import YouTube
import yt_dlp
import ffmpeg
import os

app = Flask(__name__)

@app.route('/download-mp3', methods=['POST'])
def download():
    try:
        # URL del video a descargar
        yt_link = request.json.get('link')
        if not yt_link:
            return jsonify({"error": "No se proporcionó un enlace"}), 400

        # Validar el enlace de YouTube
        if 'youtube.com' not in yt_link and 'youtu.be' not in yt_link:
            return jsonify({"error": "Enlace no válido"}), 400

        # Obtengo el titulo del video con yt_dlp
        def get_video_title(yt_link):
            ydl_opts = {
                'format': 'bestaudio/best',
                'noplaylist': True,
                'quiet': True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(yt_link, download=False)
                return info.get('title', None)

        video_title = get_video_title(yt_link)
        if not video_title:
            return jsonify({"error": "No se pudo obtener el título del video"}), 500

        # Descargar el audio desde YouTube con pytube
        yt = YouTube(yt_link)
        audio_streams = yt.streams.filter(only_audio=True).order_by('abr').desc()
        top_abr_stream = audio_streams.first()
        if not top_abr_stream:
            return jsonify({"error": "No se encontraron streams de audio"}), 500

        # Descargar el stream seleccionado y guardarlo como audio.webm
        top_abr_stream.download(filename='audio.webm')

        # Convertir el archivo webm a mp3
        input_file = ffmpeg.input('audio.webm')
        output_file = input_file.output(f'{video_title}.mp3')
        output_file.run(overwrite_output=True)

        # Eliminar el archivo temporal .webm
        os.remove('audio.webm')

        print(f"Descarga exitosa: {video_title}.mp3")
        return jsonify({"message": "Descarga exitosa", "file_name": f'{video_title}.mp3'}), 200

    except yt_dlp.utils.DownloadError as e:
        print(f"Error al descargar el audio con yt_dlp: {str(e)}")
        return jsonify({"error": f"Error al descargar el audio con yt_dlp: {str(e)}"}), 500
    except Exception as e:
        print(f"Error al descargar el audio: {str(e)}")
        return jsonify({"error": f"Error al descargar el audio: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001)
