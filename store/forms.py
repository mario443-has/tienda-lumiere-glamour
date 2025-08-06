from django import forms
from .models import Review


class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ["rating", "comentario"]
        widgets = {
            "rating": forms.NumberInput(attrs={"min": 1, "max": 5, "class": "border rounded w-full"}),
            "comentario": forms.Textarea(attrs={"rows": 3, "class": "border rounded w-full"}),
        }
