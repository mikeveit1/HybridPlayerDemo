package com.hybridplayerdemo

import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.IOException

class AudioPlayerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var mediaPlayer: MediaPlayer? = null
    private var progressHandler: Handler? = null
    private var progressRunnable: Runnable? = null
    private val updateInterval = 100L

    override fun getName(): String {
        return "AudioPlayerModule"
    }

    @ReactMethod
    fun loadTrack(trackData: ReadableMap) {
        try {
            cleanup()

            val url = trackData.getString("url")
            if (url == null) {
                sendEvent("onError", Arguments.createMap().apply {
                    putString("message", "Invalid audio URL")
                })
                return
            }

            mediaPlayer = MediaPlayer().apply {
                setDataSource(url)
                setOnPreparedListener { player ->
                    sendEvent("onTrackLoaded", Arguments.createMap().apply {
                        putDouble("duration", player.duration / 1000.0)
                    })
                    sendEvent("onPlaybackStateChanged", Arguments.createMap().apply {
                        putString("state", "idle")
                    })
                }
                setOnCompletionListener {
                    stopProgressTimer()
                    sendEvent("onProgressUpdate", Arguments.createMap().apply {
                        putDouble("position", it.duration / 1000.0)
                        putDouble("duration", it.duration / 1000.0)
                    })
                    sendEvent("onPlaybackStateChanged", Arguments.createMap().apply {
                        putString("state", "idle")
                    })
                }
                setOnErrorListener { _, what, extra ->
                    sendEvent("onError", Arguments.createMap().apply {
                        putString("message", "MediaPlayer error: $what, $extra")
                    })
                    true
                }
                prepareAsync()
            }
        } catch (e: IOException) {
            sendEvent("onError", Arguments.createMap().apply {
                putString("message", "Failed to load audio: ${e.message}")
            })
        }
    }

    @ReactMethod
    fun play(promise: Promise) {
        try {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    promise.resolve(null)
                    return
                }

                player.start()
                startProgressTimer()
                sendEvent("onPlaybackStateChanged", Arguments.createMap().apply {
                    putString("state", "playing")
                })
                promise.resolve(null)
            } ?: run {
                promise.reject("NO_PLAYER", "No audio player available")
            }
        } catch (e: Exception) {
            promise.reject("PLAY_FAILED", "Failed to start playback: ${e.message}")
        }
    }

    @ReactMethod
    fun pause(promise: Promise) {
        try {
            mediaPlayer?.let { player ->
                if (player.isPlaying) {
                    player.pause()
                }
                stopProgressTimer()
                sendEvent("onPlaybackStateChanged", Arguments.createMap().apply {
                    putString("state", "paused")
                })
                promise.resolve(null)
            } ?: run {
                promise.reject("NO_PLAYER", "No audio player available")
            }
        } catch (e: Exception) {
            promise.reject("PAUSE_FAILED", "Failed to pause playback: ${e.message}")
        }
    }

    @ReactMethod
    fun seek(position: Double, promise: Promise) {
        try {
            mediaPlayer?.let { player ->
                val positionMs = (position * 1000).toInt()
                player.seekTo(positionMs)

                sendEvent("onProgressUpdate", Arguments.createMap().apply {
                    putDouble("position", player.currentPosition / 1000.0)
                    putDouble("duration", player.duration / 1000.0)
                })
                promise.resolve(null)
            } ?: run {
                promise.reject("NO_PLAYER", "No audio player available")
            }
        } catch (e: Exception) {
            promise.reject("SEEK_FAILED", "Failed to seek: ${e.message}")
        }
    }

    @ReactMethod
    fun setVolume(volume: Double, promise: Promise) {
        try {
            mediaPlayer?.let { player ->
                val vol = volume.toFloat().coerceIn(0f, 1f)
                player.setVolume(vol, vol)
                promise.resolve(null)
            } ?: run {
                promise.reject("NO_PLAYER", "No audio player available")
            }
        } catch (e: Exception) {
            promise.reject("VOLUME_FAILED", "Failed to set volume: ${e.message}")
        }
    }

    @ReactMethod
    fun getCurrentPosition(promise: Promise) {
        mediaPlayer?.let { player ->
            promise.resolve(player.currentPosition / 1000.0)
        } ?: run {
            promise.resolve(0.0)
        }
    }

    @ReactMethod
    fun getDuration(promise: Promise) {
        mediaPlayer?.let { player ->
            promise.resolve(player.duration / 1000.0)
        } ?: run {
            promise.resolve(0.0)
        }
    }

    private fun startProgressTimer() {
        stopProgressTimer()
        progressHandler = Handler(Looper.getMainLooper())
        progressRunnable = object : Runnable {
            override fun run() {
                mediaPlayer?.let { player ->
                    if (player.isPlaying) {
                        sendEvent("onProgressUpdate", Arguments.createMap().apply {
                            putDouble("position", player.currentPosition / 1000.0)
                            putDouble("duration", player.duration / 1000.0)
                        })
                        progressHandler?.postDelayed(this, updateInterval)
                    }
                }
            }
        }
        progressHandler?.post(progressRunnable!!)
    }

    private fun stopProgressTimer() {
        progressRunnable?.let { runnable ->
            progressHandler?.removeCallbacks(runnable)
        }
        progressRunnable = null
        progressHandler = null
    }

    private fun cleanup() {
        stopProgressTimer()
        mediaPlayer?.let { player ->
            if (player.isPlaying) {
                player.stop()
            }
            player.release()
        }
        mediaPlayer = null
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}