import requests
import json
from datetime import datetime

from django.core.files import File

from cian_parser.models import InformationFromAds, CianPhoto, CianPhotoStatuses, SerializerInfo

import io


def load_photo(urls, ad):
    """
    formed list with urls, download and load in db
    :param urls:
    :return:
    """
    try:
        for url in urls:
            url_image = url.split('2.jpg')[0] + '1.jpg'
            response = requests.get(url_image)
            if response.status_code == 200:
                filename = "balakovo_" + str(ad.inf_url_ads.id) + "_" + str(datetime.now()) + ".jpg"
                photo_obj = CianPhoto()
                buf = io.BytesIO()
                buf.write(response.content)
                photo_obj.image = File(buf, filename)
                photo_obj.url_ads = ad
                photo_obj.ser_url_ads = SerializerInfo.objects.get(ser_url_ads=ad.inf_url_ads)
                photo_obj.save()
        # ad.photo_parse_status = CianPhotoStatuses.objects.get(status='Photos loaded')
        # ad.save()
    except Exception as e:
        print(e)
#
# def compress_image(uploaded_image):
#     image_temporary = Image.open(uploaded_image)
#     output_io_stream = BytesIO()
#     # image_temporaryResized = image_temporary.resize((1020, 573))
#     image_temporary.save(output_io_stream, format='JPEG', quality=30)
#     output_io_stream.seek(0)
#     uploaded_image = InMemoryUploadedFile(output_io_stream, 'ImageField', "%s.jpg" % uploaded_image.name.split('.')[0],
#                                           'image/jpeg', sys.getsizeof(output_io_stream), None)
#     return uploaded_image
#
# def save(self, *args, **kwargs):
#     if not self.id:
#         if self.image:
#             self.image = compress_image(self.image)
#         else:
#             return
#     super(FlatImageModel, self).save(*args, **kwargs)


def main():
    photo_obj = InformationFromAds.objects.filter(photo_parse_status=1).filter(urls_on_photo__startswith='["')
    for photos in photo_obj:
        urls = json.loads(photos.urls_on_photo)
        try:
            load_photo(urls, photos)
        except Exception:
            print(Exception)
    

    # driver_obj = Operadriver()
    # driver_start = driver_obj.start_driver()
    # driver = driver_obj.opera(driver_start, path[4])
    # ads_obj = InformationFromAds.objects.filter(photo_parse_status=1)
    # for ad in ads_obj:
    #     driver.get(ad.inf_url_ads.url)
    #     urls = find_urls_photo(driver)
    #     if len(urls) != 0:
    #         load_photo(urls, ad)
    #     if len(urls) == 0:
    #         ad.photo_parse_status = CianPhotoStatuses.objects.get(status='Can not loaded')
    #         ad.save()


if __name__ == '__main__':
    main()
