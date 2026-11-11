from datetime import datetime, timezone
import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .utils import crack_caesar, frequency_analysis

logger = logging.getLogger(__name__)


def _substitution_frequency_guess(ciphertext: str) -> str:
    cipher_order = frequency_analysis(ciphertext)
    english_order = "etaoinshrdlcumwfgypbvkjxqz"
    mapping = dict(zip(cipher_order, english_order))

    return "".join(
        mapping.get(character.lower(), character).upper()
        if character.isupper()
        else mapping.get(character.lower(), character)
        for character in ciphertext
    )


class CrackCipherView(APIView):
    def post(self, request):
        ciphertext = request.data.get("ciphertext")
        algorithm = request.data.get("algorithm")

        if not isinstance(ciphertext, str) or not ciphertext.strip():
            return Response(
                {"detail": "ciphertext must be a non-empty string."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not isinstance(algorithm, str):
            return Response(
                {"detail": "algorithm must be 'caesar' or 'substitution'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        algorithm = algorithm.strip().lower()
        if algorithm == "caesar":
            result = crack_caesar(ciphertext)
        elif algorithm == "substitution":
            frequencies = frequency_analysis(ciphertext)
            plaintext = _substitution_frequency_guess(ciphertext)
            result = {
                "plaintext": plaintext,
                "estimated": True,
                "letter_frequencies": frequencies,
            }
        else:
            return Response(
                {"detail": "algorithm must be 'caesar' or 'substitution'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from .firebase_config import firestore_client

            firestore_client.collection("analysis_logs").add(
                {
                    "ciphertext": ciphertext,
                    "algorithm": algorithm,
                    "plaintext": result.get("likely_plaintext", result["plaintext"]),
                    "created_at": datetime.now(timezone.utc),
                }
            )
            result["log_saved"] = True
        except Exception:
            logger.warning(
                "Firestore logging failed; returning the analysis result without saving the log.",
                exc_info=True,
            )
            result["log_saved"] = False

        return Response(result, status=status.HTTP_201_CREATED)
