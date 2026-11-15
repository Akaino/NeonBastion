"""Liefert die Testausgabe dist/web über einen lokalen Webserver aus. Module lassen sich nicht von file:// laden.

web(pfad) macht aus einem Dateipfad unter dist/web die passende Adresse. run_all.py startet den Server einmal für alle Tests
(Umgebungsvariable NB_WEB_PORT); ein einzeln gestarteter Test startet sich selbst einen.

Der Server läuft als Hintergrund-Faden im selben Prozess. Er nimmt viele Verbindungen gleichzeitig an und hält sie offen:
Vier Browser laden parallel je rund 70 Moduldateien, der einfache Server aus der Standardbibliothek (Warteschlange 5) verliert dabei Anfragen.
"""
import functools, os, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

WEB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist', 'web')
_port = int(os.environ.get('NB_WEB_PORT', '0'))


class _Handler(SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'   # Verbindungen offen halten

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


class _Server(ThreadingHTTPServer):
    request_queue_size = 512
    daemon_threads = True

    def handle_error(self, request, client_address):
        pass   # Browser schließen offene Verbindungen beim Beenden; das ist kein Fehler


def start():
    """Startet den Server (falls noch keiner läuft) und liefert den Port."""
    global _port
    if not _port:
        srv = _Server(('127.0.0.1', 0), functools.partial(_Handler, directory=WEB))
        _port = srv.server_address[1]
        threading.Thread(target=srv.serve_forever, daemon=True).start()
    return _port


def web(path, karte=False):
    """Adresse einer Datei unter dist/web. Das Spiel startet auf der Weltenkarte; die meisten Tests wollen das Menü der
    aktiven Welt und bekommen deshalb „#hub“ angehängt. karte=True lässt die Startseite, wie sie ist."""
    rel = os.path.relpath(os.path.abspath(path), WEB).replace(os.sep, '/')
    assert not rel.startswith('..'), 'liegt nicht unter dist/web: ' + path
    return 'http://localhost:%d/%s%s' % (start(), rel, '#hub' if rel.endswith('index.html') and not karte else '')
