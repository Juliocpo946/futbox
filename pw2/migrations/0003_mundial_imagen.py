from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('pw2', '0002_alter_comentario_estatus'),
    ]

    operations = [
        migrations.AddField(
            model_name='mundial',
            name='imagen',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='pw2.multimedia'),
        ),
    ]