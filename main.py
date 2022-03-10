from ytmusicapi import YTMusic
import pafy
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
ytmusic = YTMusic()

app = FastAPI()
app.mount("/static",StaticFiles(directory="./client/dist",html=True),name="static")

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/get")
async def read_root():
    return ytmusic.get_playlist(playlistId="PLK0Q01rDLbZECDAMwGQ5MZmSQDJeUWhWh") 

@app.get("/play/{id}")
async def read_root(id):
    print(pafy.new("https://www.youtube.com/watch?v="+id))
    return pafy.new("https://www.youtube.com/watch?v="+id)

