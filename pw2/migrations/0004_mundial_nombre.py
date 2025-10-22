from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('pw2', '0003_mundial_imagen'),
    ]

    operations = [
        migrations.AddField(
            model_name='mundial',
            name='nombre',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]