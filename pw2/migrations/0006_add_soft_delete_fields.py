from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pw2', '0005_multimedia_media_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='pais',
            name='activo',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='mundial',
            name='activo',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='categoria',
            name='activa',
            field=models.BooleanField(default=True),
        ),
    ]